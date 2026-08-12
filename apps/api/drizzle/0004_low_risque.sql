CREATE TYPE "public"."ticket_signing_key_status" AS ENUM('ACTIVE', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('VALID', 'USED');--> statement-breakpoint
CREATE TABLE "ticket_signing_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"algorithm" varchar(20) DEFAULT 'Ed25519' NOT NULL,
	"public_key_pem" text NOT NULL,
	"private_key_pem" text NOT NULL,
	"status" "ticket_signing_key_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone,
	CONSTRAINT "ticket_signing_keys_algorithm_check" CHECK ("ticket_signing_keys"."algorithm" = 'Ed25519')
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reservation_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"manual_code" varchar(32) NOT NULL,
	"manual_code_hash" varchar(64) NOT NULL,
	"share_token_hash" varchar(64) NOT NULL,
	"qr_version" integer DEFAULT 1 NOT NULL,
	"signing_key_id" uuid NOT NULL,
	"qr_code" text NOT NULL,
	"status" "ticket_status" DEFAULT 'VALID' NOT NULL,
	"used_at" timestamp with time zone,
	"used_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_sequence_check" CHECK ("tickets"."sequence" > 0),
	CONSTRAINT "tickets_qr_version_check" CHECK ("tickets"."qr_version" = 1)
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_signing_key_id_ticket_signing_keys_id_fk" FOREIGN KEY ("signing_key_id") REFERENCES "public"."ticket_signing_keys"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_signing_keys_one_active_unique" ON "ticket_signing_keys" USING btree ("status") WHERE "ticket_signing_keys"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_reservation_sequence_unique" ON "tickets" USING btree ("reservation_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_manual_code_unique" ON "tickets" USING btree ("manual_code");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_manual_code_hash_unique" ON "tickets" USING btree ("manual_code_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_share_token_hash_unique" ON "tickets" USING btree ("share_token_hash");--> statement-breakpoint
CREATE INDEX "tickets_customer_created_idx" ON "tickets" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "tickets_event_status_idx" ON "tickets" USING btree ("event_id","status");