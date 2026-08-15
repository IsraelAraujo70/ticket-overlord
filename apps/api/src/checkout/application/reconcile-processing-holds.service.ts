import { Injectable } from '@nestjs/common';
import { PaymentReconciliationStore } from './ports/confirmed-checkout-store';
import {
  HoldMaintenanceStore,
  HoldReconciliationStore,
} from './ports/inventory-hold-store';

export interface HoldReconciliationFailure {
  holdId: string;
  error: unknown;
}

@Injectable()
export class ReconcileProcessingHoldsService {
  constructor(
    private readonly maintenance: HoldMaintenanceStore,
    private readonly holds: HoldReconciliationStore,
    private readonly confirmed: PaymentReconciliationStore,
  ) {}

  /** Cleans expired holds and reconciles interrupted payment confirmations. */
  async run(): Promise<HoldReconciliationFailure[]> {
    await this.maintenance.cleanupExpired();
    const failures: HoldReconciliationFailure[] = [];

    for (const hold of await this.maintenance.processing()) {
      try {
        const reconciliation = await this.confirmed.reconcile(
          hold.id,
          hold.eventId,
        );
        if (reconciliation.result) {
          await this.holds.confirm(hold, reconciliation.confirmedQuantity);
        } else {
          await this.holds.release(hold);
        }
      } catch (error) {
        failures.push({ holdId: hold.id, error });
      }
    }

    return failures;
  }
}
