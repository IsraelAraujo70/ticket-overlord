ALTER TABLE "events" ALTER COLUMN "external_source" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "external_id" DROP NOT NULL;