import {
  createHash,
  createHmac,
  generateKeyPairSync,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import type { AuthenticatedUser } from '../../../auth/domain/auth.types';
import { POSTGRES_POOL } from '../../../database/database.constants';
import {
  TicketStore,
  type IssuedTicketSecret,
} from '../../application/ports/ticket-store';
import { isAdmissionDay } from '../../domain/admission-window';
import { createQrCode, verifyQrCode } from '../../domain/ticket-crypto';
import type {
  GateEventView,
  GateValidationResult,
  SharedTicketView,
  TicketStatus,
  TicketView,
} from '../../domain/ticket.types';

interface SigningKeyRow {
  id: string;
  public_key_pem: string;
  private_key_pem: string;
}

interface TicketRow {
  id: string;
  reservation_id: string;
  event_id: string;
  sequence: number;
  manual_code: string;
  qr_code: string;
  status: TicketStatus;
  used_at: Date | null;
  created_at: Date;
  event_title: string;
  starts_at: Date;
  venue: string;
  city: string;
  customer_name?: string;
  private_key_pem: string;
}

interface GateTicketRow {
  id: string;
  event_id: string;
  status: TicketStatus;
  starts_at: Date;
}

@Injectable()
export class PostgresTicketStore extends TicketStore {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

  async issueForPaidReservation(
    client: PoolClient,
    input: {
      reservationId: string;
      eventId: string;
      customerId: string;
      quantity: number;
    },
  ): Promise<IssuedTicketSecret[]> {
    const existing = await client.query<{ id: string }>(
      'SELECT id FROM tickets WHERE reservation_id = $1 ORDER BY sequence',
      [input.reservationId],
    );
    if (existing.rowCount === input.quantity) return [];

    const key = await activeSigningKey(client);
    const issued: IssuedTicketSecret[] = [];
    for (let sequence = 1; sequence <= input.quantity; sequence += 1) {
      const id = randomUUID();
      const manualCode = randomBytes(9).toString('base64url').toUpperCase();
      const shareToken = deriveShareToken(id, key.private_key_pem);
      const qrCode = createQrCode(
        key.id,
        id,
        input.eventId,
        key.private_key_pem,
      );
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO tickets (
          id, reservation_id, event_id, customer_id, sequence, manual_code,
          manual_code_hash, share_token_hash, qr_version, signing_key_id, qr_code
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$10)
        ON CONFLICT (reservation_id, sequence) DO NOTHING RETURNING id`,
        [
          id,
          input.reservationId,
          input.eventId,
          input.customerId,
          sequence,
          manualCode,
          hash(manualCode),
          hash(shareToken),
          key.id,
          qrCode,
        ],
      );
      if (inserted.rows[0]) issued.push({ id, shareToken });
    }
    return issued;
  }

  async listForCustomer(customerId: string): Promise<TicketView[]> {
    const result = await this.pool.query<TicketRow>(
      `${ticketProjection} FROM tickets t JOIN events e ON e.id = t.event_id
       JOIN ticket_signing_keys k ON k.id = t.signing_key_id
       WHERE t.customer_id = $1 ORDER BY t.created_at DESC, t.sequence`,
      [customerId],
    );
    return result.rows.map(ticketView);
  }

  async findForCustomer(
    customerId: string,
    ticketId: string,
  ): Promise<TicketView | null> {
    const result = await this.pool.query<TicketRow>(
      `${ticketProjection} FROM tickets t JOIN events e ON e.id = t.event_id
       JOIN ticket_signing_keys k ON k.id = t.signing_key_id
       WHERE t.id = $1 AND t.customer_id = $2`,
      [ticketId, customerId],
    );
    return result.rows[0] ? ticketView(result.rows[0]) : null;
  }

  async findShared(token: string): Promise<SharedTicketView | null> {
    const result = await this.pool.query<TicketRow>(
      `${ticketProjection}, u.full_name customer_name
       FROM tickets t JOIN events e ON e.id = t.event_id JOIN users u ON u.id = t.customer_id
       JOIN ticket_signing_keys k ON k.id = t.signing_key_id
       WHERE t.share_token_hash = $1`,
      [hash(token)],
    );
    const row = result.rows[0];
    if (!row?.customer_name) return null;
    const ticket = ticketView(row);
    return {
      id: ticket.id,
      reservationId: ticket.reservationId,
      eventId: ticket.eventId,
      sequence: ticket.sequence,
      manualCode: ticket.manualCode,
      qrCode: ticket.qrCode,
      status: ticket.status,
      usedAt: ticket.usedAt,
      createdAt: ticket.createdAt,
      event: ticket.event,
      customerName: row.customer_name,
    };
  }

  async listGateEvents(organizationId: string): Promise<GateEventView[]> {
    const result = await this.pool.query<{
      id: string;
      title: string;
      starts_at: Date;
      venue: string;
      city: string;
    }>(
      `SELECT id, title, starts_at, venue, city FROM events
       WHERE organization_id = $1 AND status = 'PUBLISHED' ORDER BY starts_at`,
      [organizationId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: row.starts_at,
      venue: row.venue,
      city: row.city,
    }));
  }

  async validateAtGate(input: {
    operator: AuthenticatedUser;
    eventId: string;
    code: string;
    now: Date;
  }): Promise<GateValidationResult> {
    const organizationId = input.operator.organizationId;
    if (!organizationId) return 'INVALID';
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const event = await client.query<{ starts_at: Date }>(
        `SELECT starts_at FROM events
         WHERE id = $1 AND organization_id = $2 AND status = 'PUBLISHED'
         FOR SHARE`,
        [input.eventId, organizationId],
      );
      if (!event.rows[0]) {
        await client.query('ROLLBACK');
        return 'INVALID';
      }

      const ticket = await this.resolveTicket(
        client,
        input.code,
        organizationId,
      );
      if (!ticket) {
        await client.query('ROLLBACK');
        return 'INVALID';
      }
      if (ticket.event_id !== input.eventId) {
        await client.query('ROLLBACK');
        return 'WRONG_EVENT';
      }
      if (!isAdmissionDay(event.rows[0].starts_at, input.now)) {
        await client.query('ROLLBACK');
        return 'OUTSIDE_ADMISSION_WINDOW';
      }
      if (ticket.status === 'USED') {
        await client.query('ROLLBACK');
        return 'ALREADY_USED';
      }

      const updated = await client.query(
        `UPDATE tickets SET status = 'USED', used_at = $2, used_by_user_id = $3, updated_at = $2
         WHERE id = $1 AND event_id = $4 AND status = 'VALID'`,
        [ticket.id, input.now, input.operator.id, input.eventId],
      );
      await client.query('COMMIT');
      return updated.rowCount === 1 ? 'VALID' : 'ALREADY_USED';
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async resolveTicket(
    client: PoolClient,
    code: string,
    organizationId: string,
  ): Promise<GateTicketRow | null> {
    if (!code.startsWith('to1.')) {
      const result = await client.query<GateTicketRow>(
        `SELECT t.id, t.event_id, t.status, e.starts_at FROM tickets t
         JOIN events e ON e.id = t.event_id
         WHERE t.manual_code_hash = $1 AND e.organization_id = $2`,
        [hash(code.trim().toUpperCase()), organizationId],
      );
      return result.rows[0] ?? null;
    }

    const parts = code.split('.');
    const keyId = parts[1];
    if (!keyId) return null;
    const key = await client.query<{ public_key_pem: string }>(
      'SELECT public_key_pem FROM ticket_signing_keys WHERE id = $1',
      [keyId],
    );
    const parsed = key.rows[0]
      ? verifyQrCode(code, key.rows[0].public_key_pem)
      : null;
    if (!parsed) return null;
    const result = await client.query<
      GateTicketRow & { signing_key_id: string; qr_code: string }
    >(
      `SELECT t.id, t.event_id, t.status, t.signing_key_id, t.qr_code, e.starts_at
       FROM tickets t JOIN events e ON e.id = t.event_id
       WHERE t.id = $1 AND e.organization_id = $2`,
      [parsed.ticketId, organizationId],
    );
    const row = result.rows[0];
    return row &&
      row.event_id === parsed.eventId &&
      row.signing_key_id === parsed.keyId &&
      row.qr_code === code
      ? row
      : null;
  }
}

const ticketProjection = `SELECT t.id, t.reservation_id, t.event_id, t.sequence, t.manual_code,
  t.qr_code, t.status, t.used_at, t.created_at, e.title event_title, e.starts_at, e.venue, e.city,
  k.private_key_pem`;

async function activeSigningKey(client: PoolClient): Promise<SigningKeyRow> {
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtextextended('ticket-signing-key', 0))",
  );
  const existing = await client.query<SigningKeyRow>(
    "SELECT id, public_key_pem, private_key_pem FROM ticket_signing_keys WHERE status = 'ACTIVE' LIMIT 1",
  );
  if (existing.rows[0]) return existing.rows[0];
  const pair = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { format: 'pem', type: 'spki' },
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
  });
  const created = await client.query<SigningKeyRow>(
    `INSERT INTO ticket_signing_keys (public_key_pem, private_key_pem)
     VALUES ($1, $2) RETURNING id, public_key_pem, private_key_pem`,
    [pair.publicKey, pair.privateKey],
  );
  const row = created.rows[0];
  if (!row) throw new Error('Could not create ticket signing key.');
  return row;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function deriveShareToken(ticketId: string, privateKeyPem: string): string {
  return createHmac('sha256', privateKeyPem)
    .update(`ticket-share:${ticketId}`)
    .digest('base64url');
}

function ticketView(row: TicketRow): TicketView {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    eventId: row.event_id,
    sequence: row.sequence,
    manualCode: row.manual_code,
    qrCode: row.qr_code,
    shareToken: deriveShareToken(row.id, row.private_key_pem),
    status: row.status,
    usedAt: row.used_at,
    createdAt: row.created_at,
    event: {
      title: row.event_title,
      startsAt: row.starts_at,
      venue: row.venue,
      city: row.city,
    },
  };
}
