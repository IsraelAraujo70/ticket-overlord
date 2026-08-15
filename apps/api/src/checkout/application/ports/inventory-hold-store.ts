import type { ReservationRecord } from '../models/checkout.models';

export interface EventInventorySnapshot {
  eventId: string;
  capacity: number;
  confirmedQuantity: number;
  priceInCents: number;
  currency: 'BRL';
}

export interface ProcessingHold extends ReservationRecord {
  idempotencyKey: string;
  outcome: 'APPROVED' | 'REFUSED';
  fencingToken: number;
}

export abstract class InventoryAvailabilityStore {
  abstract initialize(snapshot: EventInventorySnapshot): Promise<void>;
  abstract available(snapshot: EventInventorySnapshot): Promise<number>;
}

export abstract class ReservationHoldStore {
  abstract create(
    input: EventInventorySnapshot & { customerId: string; quantity: number },
  ): Promise<ReservationRecord>;
  abstract find(
    reservationId: string,
    customerId: string,
  ): Promise<ReservationRecord | null>;
}

export abstract class PaymentHoldStore {
  abstract prepare(input: {
    reservationId: string;
    customerId: string;
    idempotencyKey: string;
    outcome: 'APPROVED' | 'REFUSED';
  }): Promise<ProcessingHold>;
  abstract validate(hold: ProcessingHold): Promise<void>;
  abstract release(hold: ProcessingHold): Promise<void>;
  abstract confirm(
    hold: ProcessingHold,
    confirmedQuantity: number,
  ): Promise<void>;
}

export abstract class HoldReconciliationStore {
  abstract release(hold: ProcessingHold): Promise<void>;
  abstract confirm(
    hold: ProcessingHold,
    confirmedQuantity: number,
  ): Promise<void>;
}

export abstract class HoldMaintenanceStore {
  abstract cleanupExpired(): Promise<void>;
  abstract processing(): Promise<ProcessingHold[]>;
}
