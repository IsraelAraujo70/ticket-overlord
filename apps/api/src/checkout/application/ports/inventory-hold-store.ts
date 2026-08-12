import type { ReservationRecord } from '../../domain/checkout.types';

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

export abstract class InventoryHoldStore {
  abstract initialize(snapshot: EventInventorySnapshot): Promise<void>;
  abstract available(snapshot: EventInventorySnapshot): Promise<number>;
  abstract create(
    input: EventInventorySnapshot & { customerId: string; quantity: number },
  ): Promise<ReservationRecord>;
  abstract find(
    reservationId: string,
    customerId: string,
  ): Promise<ReservationRecord | null>;
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
  abstract cleanupExpired(): Promise<void>;
  abstract processing(): Promise<ProcessingHold[]>;
}
