import type {
  PaymentOutcome,
  PaymentResult,
  PublishedEventDetail,
  ReservationDetail,
  ReservationRecord,
} from '../../domain/checkout.types';

export abstract class CheckoutStore {
  abstract findPublishedEventBySlug(
    slug: string,
  ): Promise<PublishedEventDetail | null>;
  abstract createReservation(input: {
    customerId: string;
    eventId: string;
    quantity: number;
  }): Promise<ReservationRecord>;
  abstract findReservation(
    customerId: string,
    reservationId: string,
  ): Promise<ReservationDetail | null>;
  abstract processPayment(input: {
    customerId: string;
    reservationId: string;
    idempotencyKey: string;
    outcome: PaymentOutcome;
  }): Promise<PaymentResult>;
}
