import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfirmedCheckoutStore } from '../../application/ports/confirmed-checkout-store';
import { InventoryHoldStore } from '../../application/ports/inventory-hold-store';

@Injectable()
export class HoldMaintenanceService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(HoldMaintenanceService.name);
  private interval?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly holds: InventoryHoldStore,
    private readonly confirmed: ConfirmedCheckoutStore,
  ) {}

  onModuleInit(): void {
    this.interval = setInterval(() => void this.run(), 5_000);
    this.interval.unref();
  }

  onApplicationShutdown(): void {
    if (this.interval) clearInterval(this.interval);
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.holds.cleanupExpired();
      for (const hold of await this.holds.processing()) {
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
          this.logger.warn(
            `Hold ${hold.id} reconciliation skipped: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Hold maintenance skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
