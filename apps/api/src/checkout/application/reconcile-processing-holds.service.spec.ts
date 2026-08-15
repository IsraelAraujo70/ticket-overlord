import type { PaymentResult } from './models/checkout.models';
import { ReconcileProcessingHoldsService } from './reconcile-processing-holds.service';
import { PaymentReconciliationStore } from './ports/confirmed-checkout-store';
import {
  HoldMaintenanceStore,
  HoldReconciliationStore,
  type ProcessingHold,
} from './ports/inventory-hold-store';

const hold: ProcessingHold = {
  id: 'reservation-1',
  eventId: 'event-1',
  customerId: 'customer-1',
  quantity: 1,
  unitPriceInCents: 5000,
  totalInCents: 5000,
  currency: 'BRL',
  status: 'PENDING_PAYMENT',
  expiresAt: new Date('2099-01-01T00:10:00Z'),
  createdAt: new Date('2099-01-01T00:00:00Z'),
  updatedAt: new Date('2099-01-01T00:00:00Z'),
  idempotencyKey: 'payment-1',
  outcome: 'APPROVED',
  fencingToken: 1,
};

class FakeHolds implements HoldMaintenanceStore, HoldReconciliationStore {
  confirmed = false;
  released = false;
  cleaned = false;

  release(): Promise<void> {
    this.released = true;
    return Promise.resolve();
  }
  confirm(): Promise<void> {
    this.confirmed = true;
    return Promise.resolve();
  }
  cleanupExpired(): Promise<void> {
    this.cleaned = true;
    return Promise.resolve();
  }
  processing(): Promise<ProcessingHold[]> {
    return Promise.resolve([hold]);
  }
}

class FakeConfirmed extends PaymentReconciliationStore {
  result: PaymentResult | null = null;
  failure?: Error;

  reconcile(): Promise<{
    result: PaymentResult | null;
    confirmedQuantity: number;
  }> {
    if (this.failure) return Promise.reject(this.failure);
    return Promise.resolve({ result: this.result, confirmedQuantity: 1 });
  }
}

describe('ReconcileProcessingHoldsService', () => {
  it('confirms a Redis hold when PostgreSQL already committed the payment', async () => {
    const holds = new FakeHolds();
    const confirmed = new FakeConfirmed();
    confirmed.result = {} as PaymentResult;

    await expect(
      new ReconcileProcessingHoldsService(holds, holds, confirmed).run(),
    ).resolves.toEqual([]);
    expect(holds.cleaned).toBe(true);
    expect(holds.confirmed).toBe(true);
    expect(holds.released).toBe(false);
  });

  it('releases a Redis hold when PostgreSQL did not commit the payment', async () => {
    const holds = new FakeHolds();

    await new ReconcileProcessingHoldsService(
      holds,
      holds,
      new FakeConfirmed(),
    ).run();
    expect(holds.released).toBe(true);
    expect(holds.confirmed).toBe(false);
  });

  it('reports one failed hold without failing the maintenance cycle', async () => {
    const confirmed = new FakeConfirmed();
    confirmed.failure = new Error('database unavailable');

    await expect(
      new ReconcileProcessingHoldsService(
        new FakeHolds(),
        new FakeHolds(),
        confirmed,
      ).run(),
    ).resolves.toMatchObject([{ holdId: hold.id }]);
  });
});
