import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const organizationMemberRole = pgEnum('organization_member_role', [
  'OWNER',
  'STAFF',
]);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 180 }).notNull(),
    cnpj: varchar('cnpj', { length: 14 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    postalCode: varchar('postal_code', { length: 8 }).notNull(),
    street: varchar('street', { length: 180 }).notNull(),
    number: varchar('number', { length: 30 }).notNull(),
    complement: varchar('complement', { length: 120 }),
    neighborhood: varchar('neighborhood', { length: 120 }).notNull(),
    city: varchar('city', { length: 120 }).notNull(),
    state: varchar('state', { length: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('organizations_cnpj_unique').on(table.cnpj)],
);

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: organizationMemberRole('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('organization_members_org_user_unique').on(
      table.organizationId,
      table.userId,
    ),
    index('organization_members_user_idx').on(table.userId),
  ],
);
