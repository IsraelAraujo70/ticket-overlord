import type {
  PaymentResult,
  PublishedEventDetail,
  ReservationDetail,
  ReservationEventSummary,
} from '../models/checkout.models';
import type {
  EventInventorySnapshot,
  ProcessingHold,
} from './inventory-hold-store';

export abstract class PublishedEventReader {
  abstract findPublishedEventBySlug(
    slug: string,
  ): Promise<PublishedEventDetail | null>;
}

export abstract class InventorySnapshotReader {
  abstract inventorySnapshot(eventId: string): Promise<EventInventorySnapshot>;
}

export abstract class InventorySynchronizer {
  abstract synchronizeInventory<T>(
    eventId: string,
    synchronize: (snapshot: EventInventorySnapshot) => Promise<T>,
  ): Promise<T>;
}

export abstract class ConfirmedReservationReader {
  abstract eventSummary(
    eventId: string,
  ): Promise<ReservationEventSummary | null>;
  abstract findConfirmed(
    customerId: string,
    reservationId: string,
  ): Promise<ReservationDetail | null>;
}

export abstract class PaymentConfirmationStore {
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
}

export abstract class PaymentReconciliationStore {
  abstract reconcile(
    reservationId: string,
    eventId: string,
  ): Promise<{ result: PaymentResult | null; confirmedQuantity: number }>;
}
