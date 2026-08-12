import type {
  PaymentResult,
  PublishedEventDetail,
  ReservationDetail,
  ReservationEventSummary,
} from '../../domain/checkout.types';
import type {
  EventInventorySnapshot,
  ProcessingHold,
} from './inventory-hold-store';

export abstract class ConfirmedCheckoutStore {
  abstract findPublishedEventBySlug(
    slug: string,
  ): Promise<PublishedEventDetail | null>;
  abstract inventorySnapshot(eventId: string): Promise<EventInventorySnapshot>;
  abstract synchronizeInventory<T>(
    eventId: string,
    synchronize: (snapshot: EventInventorySnapshot) => Promise<T>,
  ): Promise<T>;
  abstract eventSummary(
    eventId: string,
  ): Promise<ReservationEventSummary | null>;
  abstract findConfirmed(
    customerId: string,
    reservationId: string,
  ): Promise<ReservationDetail | null>;
  abstract confirm(
    hold: ProcessingHold,
    validate: () => Promise<void>,
  ): Promise<{ result: PaymentResult; confirmedQuantity: number }>;
  abstract findPaymentResult(
    reservationId: string,
  ): Promise<PaymentResult | null>;
  abstract findPaymentResultByIdempotencyKey(
    customerId: string,
    idempotencyKey: string,
  ): Promise<PaymentResult | null>;
  abstract reconcile(
    reservationId: string,
    eventId: string,
  ): Promise<{ result: PaymentResult | null; confirmedQuantity: number }>;
}
