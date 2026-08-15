export const MAX_QUANTITY_PER_RESERVATION = 10;

export type ReservationStatus =
  'PENDING_PAYMENT' | 'PAID' | 'PAYMENT_REFUSED' | 'EXPIRED';
export type PaymentOutcome = 'APPROVED' | 'REFUSED';
