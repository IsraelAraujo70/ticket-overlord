import { sql } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', [
  'CUSTOMER',
  'ORGANIZER',
  'ADMIN',
  'ORGANIZER_STAFF',
]);

export const organizationMemberRole = pgEnum('organization_member_role', [
  'OWNER',
  'STAFF',
]);

export const authTokenPurpose = pgEnum('auth_token_purpose', [
  'EMAIL_CONFIRMATION',
  'PASSWORD_RESET',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fullName: varchar('full_name', { length: 160 }).notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(sql`lower(${table.email})`),
    index('users_role_idx').on(table.role),
  ],
);

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

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('auth_sessions_token_hash_unique').on(table.tokenHash),
    index('auth_sessions_user_idx').on(table.userId),
  ],
);

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: authTokenPurpose('purpose').notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('auth_tokens_token_hash_unique').on(table.tokenHash),
    index('auth_tokens_user_purpose_idx').on(table.userId, table.purpose),
  ],
);

export type UserRole = (typeof userRole.enumValues)[number];
export type AuthTokenPurpose = (typeof authTokenPurpose.enumValues)[number];
