import { CheckoutError } from './checkout.errors';
import {
  paymentReservationStatus,
  validateReservationQuantity,
} from './reservation';

describe('reservation rules', () => {
  it.each([1, 10])('accepts quantity %d', (quantity) => {
    expect(() => validateReservationQuantity(quantity)).not.toThrow();
  });

  it.each([0, 11, 1.5])('rejects quantity %d', (quantity) => {
    expectCheckoutError(
      () => validateReservationQuantity(quantity),
      'INVALID_QUANTITY',
    );
  });

  it('maps approved and refused payments to terminal statuses', () => {
    expect(paymentReservationStatus('PENDING_PAYMENT', 'APPROVED')).toBe(
      'PAID',
    );
    expect(paymentReservationStatus('PENDING_PAYMENT', 'REFUSED')).toBe(
      'PAYMENT_REFUSED',
    );
  });

  it.each(['PAID', 'PAYMENT_REFUSED', 'EXPIRED'] as const)(
    'rejects a payment from %s',
    (status) => {
      expectCheckoutError(
        () => paymentReservationStatus(status, 'APPROVED'),
        'RESERVATION_NOT_PAYABLE',
      );
    },
  );
});

function expectCheckoutError(
  operation: () => void,
  code: CheckoutError['code'],
): void {
  try {
    operation();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(CheckoutError);
    if (error instanceof CheckoutError) expect(error.code).toBe(code);
    return;
  }
  throw new Error(`Expected CheckoutError ${code}.`);
}
