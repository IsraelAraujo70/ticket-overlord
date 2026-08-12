import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { reservations } from './checkout';
import { events } from './events';
import { users } from './users';

export const ticketSigningKeyStatus = pgEnum('ticket_signing_key_status', [
  'ACTIVE',
  'RETIRED',
]);
export const ticketStatus = pgEnum('ticket_status', ['VALID', 'USED']);

export const ticketSigningKeys = pgTable(
  'ticket_signing_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    algorithm: varchar('algorithm', { length: 20 })
      .default('Ed25519')
      .notNull(),
    publicKeyPem: text('public_key_pem').notNull(),
    privateKeyPem: text('private_key_pem').notNull(),
    status: ticketSigningKeyStatus('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'ticket_signing_keys_algorithm_check',
      sql`${table.algorithm} = 'Ed25519'`,
    ),
    uniqueIndex('ticket_signing_keys_one_active_unique')
      .on(table.status)
      .where(sql`${table.status} = 'ACTIVE'`),
  ],
);

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey(),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, { onDelete: 'restrict' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sequence: integer('sequence').notNull(),
    manualCode: varchar('manual_code', { length: 32 }).notNull(),
    manualCodeHash: varchar('manual_code_hash', { length: 64 }).notNull(),
    shareTokenHash: varchar('share_token_hash', { length: 64 }).notNull(),
    qrVersion: integer('qr_version').default(1).notNull(),
    signingKeyId: uuid('signing_key_id')
      .notNull()
      .references(() => ticketSigningKeys.id, { onDelete: 'restrict' }),
    qrCode: text('qr_code').notNull(),
    status: ticketStatus('status').default('VALID').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    usedByUserId: uuid('used_by_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check('tickets_sequence_check', sql`${table.sequence} > 0`),
    check('tickets_qr_version_check', sql`${table.qrVersion} = 1`),
    uniqueIndex('tickets_reservation_sequence_unique').on(
      table.reservationId,
      table.sequence,
    ),
    uniqueIndex('tickets_manual_code_unique').on(table.manualCode),
    uniqueIndex('tickets_manual_code_hash_unique').on(table.manualCodeHash),
    uniqueIndex('tickets_share_token_hash_unique').on(table.shareTokenHash),
    index('tickets_customer_created_idx').on(table.customerId, table.createdAt),
    index('tickets_event_status_idx').on(table.eventId, table.status),
  ],
);
