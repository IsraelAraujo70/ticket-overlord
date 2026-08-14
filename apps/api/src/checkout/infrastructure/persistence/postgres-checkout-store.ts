import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { POSTGRES_POOL } from '../../../database/database.constants';
import { TicketStore } from '../../../tickets/application/ports/ticket-store';
import { ConfirmedCheckoutStore } from '../../application/ports/confirmed-checkout-store';
import type {
  EventInventorySnapshot,
  ProcessingHold,
} from '../../application/ports/inventory-hold-store';
import { CheckoutError } from '../../domain/checkout.errors';
import {
  MAX_QUANTITY_PER_RESERVATION,
  type PaymentRecord,
  type PaymentResult,
  type PublishedEventDetail,
  type ReservationDetail,
  type ReservationRecord,
} from '../../domain/checkout.types';

interface EventRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  source_release_date: string | null;
  source_image_url: string | null;
  starts_at: Date;
  venue: string;
  city: string;
  capacity: number;
  price_in_cents: number;
  currency: string;
  cover_object_key: string;
  cover_content_type: string;
  confirmed_quantity: number;
  is_purchasable: boolean;
}
interface ReservationRow {
  id: string;
  event_id: string;
  customer_id: string;
  quantity: number;
  unit_price_in_cents: number;
  total_in_cents: number;
  currency: string;
  status: 'PAID';
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}
interface PaymentRow {
  id: string;
  reservation_id: string;
  customer_id: string;
  amount_in_cents: number;
  currency: string;
  status: 'APPROVED';
  idempotency_key: string;
  created_at: Date;
  processed_at: Date;
}

@Injectable()
export class PostgresCheckoutStore extends ConfirmedCheckoutStore {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool: Pool,
    private readonly tickets: TicketStore,
  ) {
    super();
  }

  async findPublishedEventBySlug(
    slug: string,
  ): Promise<PublishedEventDetail | null> {
    const result = await this.pool.query<EventRow>(
      `${eventSelect} WHERE e.slug = $1 AND e.status = 'PUBLISHED' GROUP BY e.id`,
      [slug],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...eventSummary(row),
      summary: row.summary,
      category: row.category,
      sourceReleaseDate: row.source_release_date,
      sourceImageUrl: row.source_image_url,
      capacity: row.capacity,
      priceInCents: row.price_in_cents,
      currency: brl(row.currency),
      coverContentType: row.cover_content_type,
      availableQuantity: Math.max(row.capacity - row.confirmed_quantity, 0),
      maxQuantityPerReservation: MAX_QUANTITY_PER_RESERVATION,
      isPurchasable: row.is_purchasable,
    };
  }

  async inventorySnapshot(eventId: string): Promise<EventInventorySnapshot> {
    const result = await this.pool.query<EventRow>(
      `${eventSelect} WHERE e.id = $1 AND e.status = 'PUBLISHED' AND e.starts_at > now() GROUP BY e.id`,
      [eventId],
    );
    const row = result.rows[0];
    if (!row)
      throw new CheckoutError(
        'EVENT_NOT_AVAILABLE',
        'Evento não disponível para venda.',
      );
    return {
      eventId: row.id,
      capacity: row.capacity,
      confirmedQuantity: row.confirmed_quantity,
      priceInCents: row.price_in_cents,
      currency: brl(row.currency),
    };
  }

  async synchronizeInventory<T>(
    eventId: string,
    synchronize: (snapshot: EventInventorySnapshot) => Promise<T>,
  ): Promise<T> {
    return this.transaction(async (client) => {
      await advisoryLock(client, `event:${eventId}`);
      const result = await client.query<EventRow>(
        `${eventSelect} WHERE e.id = $1 AND e.status = 'PUBLISHED' AND e.starts_at > now() GROUP BY e.id`,
        [eventId],
      );
      const row = result.rows[0];
      if (!row)
        throw new CheckoutError(
          'EVENT_NOT_AVAILABLE',
          'Evento não disponível para venda.',
        );
      return synchronize({
        eventId: row.id,
        capacity: row.capacity,
        confirmedQuantity: row.confirmed_quantity,
        priceInCents: row.price_in_cents,
        currency: brl(row.currency),
      });
    });
  }

  async eventSummary(eventId: string) {
    const result = await this.pool.query<{
      id: string;
      slug: string;
      title: string;
      starts_at: Date;
      venue: string;
      city: string;
      cover_object_key: string;
    }>(
      'SELECT id, slug, title, starts_at, venue, city, cover_object_key FROM events WHERE id = $1',
      [eventId],
    );
    return result.rows[0] ? eventSummary(result.rows[0]) : null;
  }

  async findConfirmed(
    customerId: string,
    reservationId: string,
  ): Promise<ReservationDetail | null> {
    const result = await this.pool.query<
      ReservationRow & {
        slug: string;
        title: string;
        starts_at: Date;
        venue: string;
        city: string;
        cover_object_key: string;
      }
    >(
      `SELECT r.*, e.slug, e.title, e.starts_at, e.venue, e.city, e.cover_object_key FROM reservations r JOIN events e ON e.id = r.event_id WHERE r.id = $1 AND r.customer_id = $2 AND r.status = 'PAID'`,
      [reservationId, customerId],
    );
    const row = result.rows[0];
    return row
      ? {
          ...reservationRecord(row),
          event: eventSummary({ ...row, id: row.event_id }),
        }
      : null;
  }

  async confirm(
    hold: ProcessingHold,
    validate: () => Promise<void>,
  ): Promise<{ result: PaymentResult; confirmedQuantity: number }> {
    return this.transaction(async (client) => {
      await advisoryLock(client, `hold:${hold.id}`);
      await advisoryLock(
        client,
        `payment:${hold.customerId}:${hold.idempotencyKey}`,
      );
      const idempotent = await client.query<{ reservation_id: string }>(
        `SELECT reservation_id FROM payments
         WHERE customer_id = $1 AND idempotency_key = $2`,
        [hold.customerId, hold.idempotencyKey],
      );
      if (idempotent.rows[0] && idempotent.rows[0].reservation_id !== hold.id) {
        throw new CheckoutError(
          'IDEMPOTENCY_CONFLICT',
          'A chave de idempotência já foi usada com outros parâmetros.',
        );
      }
      const existing = await this.findPaymentResultWith(client, hold.id);
      if (existing) {
        ensureReplay(existing, hold);
        return {
          result: existing,
          confirmedQuantity: await confirmedTotal(client, hold.eventId),
        };
      }
      await advisoryLock(client, `event:${hold.eventId}`);
      await validate();
      const inventory = await client.query<{
        capacity: number;
        confirmed_quantity: number;
      }>(
        `SELECT e.capacity, COALESCE(SUM(r.quantity), 0)::integer confirmed_quantity
         FROM events e
         LEFT JOIN reservations r ON r.event_id = e.id AND r.status = 'PAID'
         WHERE e.id = $1
         GROUP BY e.id`,
        [hold.eventId],
      );
      const current = required(inventory.rows[0]);
      if (current.confirmed_quantity + hold.quantity > current.capacity) {
        throw new CheckoutError(
          'INSUFFICIENT_INVENTORY',
          'A quantidade solicitada não está disponível.',
        );
      }
      const reservation = await client.query<ReservationRow>(
        `INSERT INTO reservations (id, event_id, customer_id, quantity, unit_price_in_cents, total_in_cents, currency, status, expires_at, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'PAID',$8,$9,now()) RETURNING *`,
        [
          hold.id,
          hold.eventId,
          hold.customerId,
          hold.quantity,
          hold.unitPriceInCents,
          hold.totalInCents,
          hold.currency,
          hold.expiresAt,
          hold.createdAt,
        ],
      );
      const payment = await client.query<PaymentRow>(
        `INSERT INTO payments (reservation_id, customer_id, amount_in_cents, currency, status, idempotency_key, processed_at) VALUES ($1,$2,$3,$4,'APPROVED',$5,now()) RETURNING *`,
        [
          hold.id,
          hold.customerId,
          hold.totalInCents,
          hold.currency,
          hold.idempotencyKey,
        ],
      );
      await this.tickets.issueForPaidReservation(client, {
        reservationId: hold.id,
        eventId: hold.eventId,
        customerId: hold.customerId,
        quantity: hold.quantity,
      });
      return {
        result: {
          reservation: reservationRecord(required(reservation.rows[0])),
          payment: paymentRecord(required(payment.rows[0])),
        },
        confirmedQuantity: await confirmedTotal(client, hold.eventId),
      };
    });
  }

  async findPaymentResult(
    reservationId: string,
  ): Promise<PaymentResult | null> {
    return this.findPaymentResultWith(this.pool, reservationId);
  }

  async findPaymentResultByIdempotencyKey(
    customerId: string,
    idempotencyKey: string,
  ): Promise<PaymentResult | null> {
    const result = await this.pool.query<{ reservation_id: string }>(
      `SELECT reservation_id FROM payments
       WHERE customer_id = $1 AND idempotency_key = $2`,
      [customerId, idempotencyKey],
    );
    const reservationId = result.rows[0]?.reservation_id;
    return reservationId
      ? this.findPaymentResultWith(this.pool, reservationId)
      : null;
  }

  async reconcile(
    reservationId: string,
    eventId: string,
  ): Promise<{ result: PaymentResult | null; confirmedQuantity: number }> {
    return this.transaction(async (client) => {
      await advisoryLock(client, `hold:${reservationId}`);
      return {
        result: await this.findPaymentResultWith(client, reservationId),
        confirmedQuantity: await confirmedTotal(client, eventId),
      };
    });
  }

  private async findPaymentResultWith(
    queryable: Pick<Pool, 'query'> | Pick<PoolClient, 'query'>,
    reservationId: string,
  ): Promise<PaymentResult | null> {
    const result = await queryable.query<
      ReservationRow & {
        payment_id: string;
        amount_in_cents: number;
        payment_currency: string;
        payment_status: 'APPROVED';
        idempotency_key: string;
        payment_created_at: Date;
        processed_at: Date;
      }
    >(
      `SELECT r.*, p.id payment_id, p.amount_in_cents, p.currency payment_currency, p.status payment_status, p.idempotency_key, p.created_at payment_created_at, p.processed_at FROM reservations r JOIN payments p ON p.reservation_id = r.id WHERE r.id = $1`,
      [reservationId],
    );
    const row = result.rows[0];
    return row
      ? {
          reservation: reservationRecord(row),
          payment: paymentRecord({
            id: row.payment_id,
            reservation_id: row.id,
            customer_id: row.customer_id,
            amount_in_cents: row.amount_in_cents,
            currency: row.payment_currency,
            status: row.payment_status,
            idempotency_key: row.idempotency_key,
            created_at: row.payment_created_at,
            processed_at: row.processed_at,
          }),
        }
      : null;
  }

  private async transaction<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

const eventSelect = `SELECT e.*, COALESCE(SUM(r.quantity) FILTER (WHERE r.status = 'PAID'), 0)::integer confirmed_quantity, e.starts_at > now() is_purchasable FROM events e LEFT JOIN reservations r ON r.event_id = e.id`;
async function advisoryLock(client: PoolClient, key: string) {
  await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [
    key,
  ]);
}
async function confirmedTotal(client: PoolClient, eventId: string) {
  const result = await client.query<{ total: number }>(
    `SELECT COALESCE(SUM(quantity), 0)::integer total FROM reservations WHERE event_id = $1 AND status = 'PAID'`,
    [eventId],
  );
  return result.rows[0]?.total ?? 0;
}
function ensureReplay(result: PaymentResult, hold: ProcessingHold) {
  if (
    result.reservation.customerId !== hold.customerId ||
    result.payment.idempotencyKey !== hold.idempotencyKey ||
    hold.outcome !== 'APPROVED'
  )
    throw new CheckoutError(
      'IDEMPOTENCY_CONFLICT',
      'A chave de idempotência já foi usada com outros parâmetros.',
    );
}
function reservationRecord(row: ReservationRow): ReservationRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    customerId: row.customer_id,
    quantity: row.quantity,
    unitPriceInCents: row.unit_price_in_cents,
    totalInCents: row.total_in_cents,
    currency: brl(row.currency),
    status: 'PAID',
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function paymentRecord(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    customerId: row.customer_id,
    amountInCents: row.amount_in_cents,
    currency: brl(row.currency),
    status: 'APPROVED',
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  };
}
function eventSummary(row: {
  id: string;
  slug: string;
  title: string;
  starts_at: Date;
  venue: string;
  city: string;
  cover_object_key: string;
}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    startsAt: row.starts_at,
    venue: row.venue,
    city: row.city,
    coverObjectKey: row.cover_object_key,
  };
}
function brl(value: string): 'BRL' {
  if (value !== 'BRL') throw new Error(`Unsupported currency ${value}.`);
  return value;
}
function required<T>(value: T | undefined): T {
  if (!value) throw new Error('Expected database row.');
  return value;
}
