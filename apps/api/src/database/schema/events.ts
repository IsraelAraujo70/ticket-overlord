import {
  date,
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
import { organizations } from './organizations';

export const eventStatus = pgEnum('event_status', ['DRAFT', 'PUBLISHED']);
export const externalCatalogSource = pgEnum('external_catalog_source', [
  'TMDB',
]);

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalSource: externalCatalogSource('external_source'),
    externalId: varchar('external_id', { length: 64 }),
    slug: varchar('slug', { length: 240 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    summary: text('summary').notNull(),
    category: varchar('category', { length: 80 }).notNull(),
    sourceReleaseDate: date('source_release_date'),
    sourceImageUrl: text('source_image_url'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    venue: varchar('venue', { length: 180 }).notNull(),
    city: varchar('city', { length: 120 }).notNull(),
    capacity: integer('capacity').notNull(),
    priceInCents: integer('price_in_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('BRL').notNull(),
    coverObjectKey: varchar('cover_object_key', { length: 1024 }).notNull(),
    coverContentType: varchar('cover_content_type', { length: 50 }).notNull(),
    status: eventStatus('status').default('DRAFT').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('events_slug_unique').on(table.slug),
    index('events_organization_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
    index('events_published_starts_at_idx').on(table.status, table.startsAt),
  ],
);
