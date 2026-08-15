import {
  createHash,
  createHmac,
  generateKeyPairSync,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import type { PoolClient } from 'pg';
import { createQrCode } from '../../domain/ticket-crypto';

interface SigningKeyRow {
  id: string;
  public_key_pem: string;
  private_key_pem: string;
}

export interface PaidReservationTicketInput {
  reservationId: string;
  eventId: string;
  customerId: string;
  quantity: number;
}

/** Issues every ticket inside the transaction owned by the checkout adapter. */
export async function issuePaidReservationTickets(
  client: PoolClient,
  input: PaidReservationTicketInput,
): Promise<void> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM tickets WHERE reservation_id = $1 ORDER BY sequence',
    [input.reservationId],
  );
  if (existing.rowCount === input.quantity) return;

  const key = await activeSigningKey(client);
  for (let sequence = 1; sequence <= input.quantity; sequence += 1) {
    const id = randomUUID();
    const manualCode = randomBytes(9).toString('base64url').toUpperCase();
    const shareToken = deriveTicketShareToken(id, key.private_key_pem);
    const qrCode = createQrCode(key.id, id, input.eventId, key.private_key_pem);
    await client.query(
      `INSERT INTO tickets (
        id, reservation_id, event_id, customer_id, sequence, manual_code,
        manual_code_hash, share_token_hash, qr_version, signing_key_id, qr_code
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$10)
      ON CONFLICT (reservation_id, sequence) DO NOTHING`,
      [
        id,
        input.reservationId,
        input.eventId,
        input.customerId,
        sequence,
        manualCode,
        hashTicketSecret(manualCode),
        hashTicketSecret(shareToken),
        key.id,
        qrCode,
      ],
    );
  }
}

export function hashTicketSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function deriveTicketShareToken(
  ticketId: string,
  privateKeyPem: string,
): string {
  return createHmac('sha256', privateKeyPem)
    .update(`ticket-share:${ticketId}`)
    .digest('base64url');
}

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
