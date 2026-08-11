CREATE TYPE "public"."event_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."external_catalog_source" AS ENUM('TMDB');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"external_source" "external_catalog_source" NOT NULL,
	"external_id" varchar(64) NOT NULL,
	"slug" varchar(240) NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" text NOT NULL,
	"category" varchar(80) NOT NULL,
	"source_release_date" date,
	"source_image_url" text,
	"starts_at" timestamp with time zone NOT NULL,
	"venue" varchar(180) NOT NULL,
	"city" varchar(120) NOT NULL,
	"capacity" integer NOT NULL,
	"price_in_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"cover_object_key" varchar(1024) NOT NULL,
	"cover_content_type" varchar(50) NOT NULL,
	"status" "event_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_unique" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_organization_created_idx" ON "events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "events_published_starts_at_idx" ON "events" USING btree ("status","starts_at");