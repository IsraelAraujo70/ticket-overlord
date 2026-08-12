import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { POSTGRES_POOL } from '../../../database/database.constants';
import { CheckoutStore } from '../../application/ports/checkout-store';
import { CheckoutError } from '../../domain/checkout.errors';
import { paymentReservationStatus } from '../../domain/reservation';
import {
  MAX_QUANTITY_PER_RESERVATION,
  type PaymentOutcome,
  type PaymentRecord,
  type PaymentResult,
  type PublishedEventDetail,
  type ReservationDetail,
  type ReservationRecord,
  type ReservationStatus,
} from '../../domain/checkout.types';

interface ReservationRow {
  id: string;
  event_id: string;
  customer_id: string;
  quantity: number;
  unit_price_in_cents: number;
  total_in_cents: number;
  currency: string;
  status: ReservationStatus;
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
  status: PaymentOutcome;
  idempotency_key: string;
  created_at: Date;
  processed_at: Date;
}

interface EventSummaryRow {
  id: string;
  slug: string;
  title: string;
  starts_at: Date;
  venue: string;
  city: string;
  cover_object_key: string;
}

interface PublishedEventRow extends EventSummaryRow {
  summary: string;
  category: string;
  source_release_date: string | null;
  source_image_url: string | null;
  capacity: number;
  price_in_cents: number;
  currency: string;
  cover_content_type: string;
  available_quantity: number;
}

@Injectable()
export class PostgresCheckoutStore extends CheckoutStore {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

  async findPublishedEventBySlug(
    slug: string,
  ): Promise<PublishedEventDetail | null> {
    const result = await this.pool.query<PublishedEventRow>(
      `SELECT e.id, e.slug, e.title, e.summary, e.category,
              e.source_release_date, e.source_image_url, e.starts_at,
              e.venue, e.city, e.capacity, e.price_in_cents, e.currency,
              e.cover_object_key, e.cover_content_type,
              GREATEST(e.capacity - COALESCE(SUM(r.quantity) FILTER (
                WHERE r.status = 'PAID'
                   OR (r.status = 'PENDING_PAYMENT' AND r.expires_at > now())
              ), 0), 0)::integer AS available_quantity
       FROM events e
       LEFT JOIN reservations r ON r.event_id = e.id
       WHERE e.slug = $1 AND e.status = 'PUBLISHED' AND e.starts_at > now()
       GROUP BY e.id`,
      [slug],
    );
    const row = result.rows[0];
    return row ? publishedEvent(row) : null;
  }

  async createReservation(input: {
    customerId: string;
    eventId: string;
    quantity: number;
  }): Promise<ReservationRecord> {
    return this.transaction(async (client) => {
      const eventResult = await client.query<{
        id: string;
        capacity: number;
        price_in_cents: number;
        currency: string;
      }>(
        `SELECT id, capacity, price_in_cents, currency
         FROM events
         WHERE id = $1 AND status = 'PUBLISHED' AND starts_at > now()
         FOR UPDATE`,
        [input.eventId],
      );
      const event = eventResult.rows[0];
      if (!event) {
        throw new CheckoutError(
          'EVENT_NOT_AVAILABLE',
          'Evento não disponível para venda.',
        );
      }

      await client.query(
        `UPDATE reservations
         SET status = 'EXPIRED', updated_at = now()
         WHERE event_id = $1
           AND status = 'PENDING_PAYMENT'
           AND expires_at <= now()`,
        [event.id],
      );
      const allocatedResult = await client.query<{ allocated: number }>(
        `SELECT COALESCE(SUM(quantity), 0)::integer AS allocated
         FROM reservations
         WHERE event_id = $1
           AND (status = 'PAID'
             OR (status = 'PENDING_PAYMENT' AND expires_at > now()))`,
        [event.id],
      );
      const allocated = allocatedResult.rows[0]?.allocated ?? 0;
      if (input.quantity > event.capacity - allocated) {
        throw new CheckoutError(
          'INSUFFICIENT_INVENTORY',
          'A quantidade solicitada não está disponível.',
        );
      }

      const inserted = await client.query<ReservationRow>(
        `INSERT INTO reservations (
           event_id, customer_id, quantity, unit_price_in_cents,
           total_in_cents, currency, expires_at
         ) VALUES (
           $1, $2, $3, $4, $4::integer * $3::integer, $5,
           now() + interval '10 minutes'
         )
         RETURNING *`,
        [
          event.id,
          input.customerId,
          input.quantity,
          event.price_in_cents,
          event.currency,
        ],
      );
      return reservationRecord(requiredRow(inserted.rows[0], 'reservation'));
    });
  }

  async findReservation(
    customerId: string,
    reservationId: string,
  ): Promise<ReservationDetail | null> {
    const link = await this.pool.query<{ event_id: string }>(
      'SELECT event_id FROM reservations WHERE id = $1 AND customer_id = $2',
      [reservationId, customerId],
    );
    const eventId = link.rows[0]?.event_id;
    if (!eventId) return null;

    return this.transaction(async (client) => {
      const eventResult = await client.query<EventSummaryRow>(
        `SELECT id, slug, title, starts_at, venue, city, cover_object_key
         FROM events WHERE id = $1 FOR UPDATE`,
        [eventId],
      );
      const event = requiredRow(eventResult.rows[0], 'event');
      const reservationResult = await client.query<ReservationRow>(
        `SELECT * FROM reservations
         WHERE id = $1 AND customer_id = $2
         FOR UPDATE`,
        [reservationId, customerId],
      );
      let reservation = reservationResult.rows[0];
      if (!reservation) return null;

      const expired = await client.query<ReservationRow>(
        `UPDATE reservations
         SET status = 'EXPIRED', updated_at = now()
         WHERE id = $1 AND status = 'PENDING_PAYMENT' AND expires_at <= now()
         RETURNING *`,
        [reservation.id],
      );
      reservation = expired.rows[0] ?? reservation;

      return { ...reservationRecord(reservation), event: eventSummary(event) };
    });
  }

  async processPayment(input: {
    customerId: string;
    reservationId: string;
    idempotencyKey: string;
    outcome: PaymentOutcome;
  }): Promise<PaymentResult> {
    const link = await this.pool.query<{ event_id: string }>(
      'SELECT event_id FROM reservations WHERE id = $1',
      [input.reservationId],
    );
    const eventId = link.rows[0]?.event_id;
    if (!eventId) {
      throw new CheckoutError(
        'RESERVATION_NOT_FOUND',
        'Reserva não encontrada.',
      );
    }

    const result = await this.transaction<PaymentResult | null>(
      async (client) => {
        await client.query('SELECT id FROM events WHERE id = $1 FOR UPDATE', [
          eventId,
        ]);
        const reservationResult = await client.query<ReservationRow>(
          'SELECT * FROM reservations WHERE id = $1 FOR UPDATE',
          [input.reservationId],
        );
        let reservation = reservationResult.rows[0];
        if (!reservation || reservation.customer_id !== input.customerId) {
          throw new CheckoutError(
            'RESERVATION_NOT_FOUND',
            'Reserva não encontrada.',
          );
        }

        const expired = await client.query<ReservationRow>(
          `UPDATE reservations
         SET status = 'EXPIRED', updated_at = now()
         WHERE id = $1 AND status = 'PENDING_PAYMENT' AND expires_at <= now()
         RETURNING *`,
          [reservation.id],
        );
        reservation = expired.rows[0] ?? reservation;

        const replayResult = await client.query<PaymentRow>(
          `SELECT * FROM payments
         WHERE customer_id = $1 AND idempotency_key = $2`,
          [input.customerId, input.idempotencyKey],
        );
        const replay = replayResult.rows[0];
        if (replay) return replayPayment(replay, reservation, input);

        if (reservation.status === 'EXPIRED') {
          return null;
        }
        const nextStatus = paymentReservationStatus(
          reservation.status,
          input.outcome,
        );

        const inserted = await client.query<PaymentRow>(
          `INSERT INTO payments (
           reservation_id, customer_id, amount_in_cents, currency,
           status, idempotency_key, processed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, now())
         ON CONFLICT (customer_id, idempotency_key) DO NOTHING
         RETURNING *`,
          [
            reservation.id,
            input.customerId,
            reservation.total_in_cents,
            reservation.currency,
            input.outcome,
            input.idempotencyKey,
          ],
        );
        const payment = inserted.rows[0];
        if (!payment) {
          const concurrent = await client.query<PaymentRow>(
            `SELECT * FROM payments
           WHERE customer_id = $1 AND idempotency_key = $2`,
            [input.customerId, input.idempotencyKey],
          );
          return replayPayment(
            requiredRow(concurrent.rows[0], 'concurrent payment'),
            reservation,
            input,
          );
        }

        const updated = await client.query<ReservationRow>(
          `UPDATE reservations
         SET status = $2, updated_at = now()
         WHERE id = $1
         RETURNING *`,
          [reservation.id, nextStatus],
        );
        return {
          payment: paymentRecord(payment),
          reservation: reservationRecord(
            requiredRow(updated.rows[0], 'updated reservation'),
          ),
        };
      },
    );
    if (!result) {
      throw new CheckoutError(
        'RESERVATION_EXPIRED',
        'A reserva expirou e não pode ser paga.',
      );
    }
    return result;
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

function replayPayment(
  payment: PaymentRow,
  reservation: ReservationRow,
  input: {
    reservationId: string;
    outcome: PaymentOutcome;
  },
): PaymentResult {
  if (
    payment.reservation_id !== input.reservationId ||
    payment.status !== input.outcome
  ) {
    throw new CheckoutError(
      'IDEMPOTENCY_CONFLICT',
      'A chave de idempotência já foi usada com outros parâmetros.',
    );
  }
  return {
    payment: paymentRecord(payment),
    reservation: reservationRecord(reservation),
  };
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
    status: row.status,
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
    status: row.status,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  };
}

function eventSummary(row: EventSummaryRow) {
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

function publishedEvent(row: PublishedEventRow): PublishedEventDetail {
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
    availableQuantity: row.available_quantity,
    maxQuantityPerReservation: MAX_QUANTITY_PER_RESERVATION,
  };
}

function brl(currency: string): 'BRL' {
  if (currency !== 'BRL') throw new Error(`Unsupported currency ${currency}.`);
  return 'BRL';
}

function requiredRow<T>(row: T | undefined, name: string): T {
  if (!row) throw new Error(`Expected ${name} row.`);
  return row;
}
