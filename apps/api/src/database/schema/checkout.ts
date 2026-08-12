import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { events } from './events';
import { users } from './users';

export const reservationStatus = pgEnum('reservation_status', [
  'PENDING_PAYMENT',
  'PAID',
  'PAYMENT_REFUSED',
  'EXPIRED',
]);

export const paymentStatus = pgEnum('payment_status', ['APPROVED', 'REFUSED']);

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPriceInCents: integer('unit_price_in_cents').notNull(),
    totalInCents: integer('total_in_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    status: reservationStatus('status').default('PENDING_PAYMENT').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'reservations_quantity_check',
      sql`${table.quantity} BETWEEN 1 AND 10`,
    ),
    check('reservations_unit_price_check', sql`${table.unitPriceInCents} > 0`),
    check('reservations_total_check', sql`${table.totalInCents} > 0`),
    index('reservations_event_status_idx').on(table.eventId, table.status),
    index('reservations_customer_created_idx').on(
      table.customerId,
      table.createdAt,
    ),
    index('reservations_expires_at_idx').on(table.expiresAt),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    amountInCents: integer('amount_in_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    status: paymentStatus('status').notNull(),
    idempotencyKey: uuid('idempotency_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check('payments_amount_check', sql`${table.amountInCents} > 0`),
    uniqueIndex('payments_customer_idempotency_unique').on(
      table.customerId,
      table.idempotencyKey,
    ),
    index('payments_reservation_idx').on(table.reservationId),
  ],
);
