CREATE TYPE "public"."payment_status" AS ENUM('APPROVED', 'REFUSED');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('PENDING_PAYMENT', 'PAID', 'PAYMENT_REFUSED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" "payment_status" NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_check" CHECK ("payments"."amount_in_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_in_cents" integer NOT NULL,
	"total_in_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" "reservation_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_quantity_check" CHECK ("reservations"."quantity" BETWEEN 1 AND 10),
	CONSTRAINT "reservations_unit_price_check" CHECK ("reservations"."unit_price_in_cents" > 0),
	CONSTRAINT "reservations_total_check" CHECK ("reservations"."total_in_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_customer_idempotency_unique" ON "payments" USING btree ("customer_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_reservation_idx" ON "payments" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "reservations_event_status_idx" ON "reservations" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "reservations_customer_created_idx" ON "reservations" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "reservations_expires_at_idx" ON "reservations" USING btree ("expires_at");