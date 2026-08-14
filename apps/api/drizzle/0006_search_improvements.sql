CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint

ALTER TABLE "events"
  ADD COLUMN "search_title" text GENERATED ALWAYS AS (
    translate(lower(title), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  ) STORED,
  ADD COLUMN "search_category" text GENERATED ALWAYS AS (
    translate(lower(category), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  ) STORED,
  ADD COLUMN "search_city" text GENERATED ALWAYS AS (
    translate(lower(city), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  ) STORED,
  ADD COLUMN "search_venue" text GENERATED ALWAYS AS (
    translate(lower(venue), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  ) STORED,
  ADD COLUMN "search_document" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', translate(lower(coalesce(title, '')), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')), 'A') ||
    setweight(to_tsvector('portuguese', translate(lower(coalesce(category, '') || ' ' || coalesce(city, '') || ' ' || coalesce(venue, '')), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')), 'B') ||
    setweight(to_tsvector('portuguese', translate(lower(coalesce(summary, '')), 'áàãâäéèêëíìîïóòõôöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')), 'C')
  ) STORED;--> statement-breakpoint

CREATE INDEX "events_published_search_document_idx"
  ON "events" USING gin ("search_document") WHERE "status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX "events_published_search_title_trgm_idx"
  ON "events" USING gin ("search_title" gin_trgm_ops) WHERE "status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX "events_published_search_category_trgm_idx"
  ON "events" USING gin ("search_category" gin_trgm_ops) WHERE "status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX "events_published_search_city_trgm_idx"
  ON "events" USING gin ("search_city" gin_trgm_ops) WHERE "status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX "events_published_search_venue_trgm_idx"
  ON "events" USING gin ("search_venue" gin_trgm_ops) WHERE "status" = 'PUBLISHED';--> statement-breakpoint

CREATE TABLE "event_search_embeddings" (
  "event_id" uuid PRIMARY KEY NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "embedding" vector(1536) NOT NULL,
  "content_hash" varchar(64) NOT NULL,
  "model" varchar(160) NOT NULL,
  "indexed_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "event_search_embeddings_cosine_idx"
  ON "event_search_embeddings" USING hnsw ("embedding" vector_cosine_ops);
