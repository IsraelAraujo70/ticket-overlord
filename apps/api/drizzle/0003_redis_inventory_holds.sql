BEGIN;
DELETE FROM payments WHERE status = 'REFUSED';
DELETE FROM reservations WHERE status IN ('PENDING_PAYMENT', 'PAYMENT_REFUSED', 'EXPIRED');
DELETE FROM payments p
USING payments duplicate
WHERE p.reservation_id = duplicate.reservation_id
  AND (p.created_at, p.id) > (duplicate.created_at, duplicate.id);
ALTER TYPE payment_status RENAME TO payment_status_legacy;
CREATE TYPE payment_status AS ENUM ('APPROVED');
ALTER TABLE payments ALTER COLUMN status TYPE payment_status USING status::text::payment_status;
DROP TYPE payment_status_legacy;
ALTER TYPE reservation_status RENAME TO reservation_status_legacy;
CREATE TYPE reservation_status AS ENUM ('PAID');
ALTER TABLE reservations ALTER COLUMN status DROP DEFAULT;
ALTER TABLE reservations ALTER COLUMN status TYPE reservation_status USING status::text::reservation_status;
ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'PAID';
DROP TYPE reservation_status_legacy;
DROP INDEX payments_reservation_idx;
CREATE UNIQUE INDEX payments_reservation_unique ON payments (reservation_id);
COMMIT;
