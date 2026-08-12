export type CheckoutErrorCode =
  | 'CUSTOMER_REQUIRED'
  | 'INVALID_QUANTITY'
  | 'EVENT_NOT_AVAILABLE'
  | 'INSUFFICIENT_INVENTORY'
  | 'RESERVATION_NOT_FOUND'
  | 'RESERVATION_EXPIRED'
  | 'RESERVATION_NOT_PAYABLE'
  | 'IDEMPOTENCY_CONFLICT'
  | 'CHECKOUT_UNAVAILABLE';

export class CheckoutError extends Error {
  constructor(
    readonly code: CheckoutErrorCode,
    message: string,
  ) {
    super(message);
  }
}
