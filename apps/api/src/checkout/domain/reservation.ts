import { CheckoutError } from './checkout.errors';
import {
  MAX_QUANTITY_PER_RESERVATION,
  type ReservationStatus,
} from './checkout.types';

/** Validates the quantity boundary shared by reservation entry points. */
export function validateReservationQuantity(quantity: number): void {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_QUANTITY_PER_RESERVATION
  ) {
    throw new CheckoutError(
      'INVALID_QUANTITY',
      `A quantidade deve estar entre 1 e ${MAX_QUANTITY_PER_RESERVATION}.`,
    );
  }
}

/** Determines the terminal reservation status for a simulated payment. */
export function paymentReservationStatus(
  current: ReservationStatus,
  outcome: 'APPROVED' | 'REFUSED',
): ReservationStatus {
  if (current !== 'PENDING_PAYMENT') {
    throw new CheckoutError(
      'RESERVATION_NOT_PAYABLE',
      'A reserva não aceita uma nova tentativa de pagamento.',
    );
  }

  return outcome === 'APPROVED' ? 'PAID' : 'PAYMENT_REFUSED';
}
