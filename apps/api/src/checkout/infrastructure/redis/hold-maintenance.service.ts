import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ReconcileProcessingHoldsService } from '../../application/reconcile-processing-holds.service';

@Injectable()
export class HoldMaintenanceService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(HoldMaintenanceService.name);
  private interval?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly reconciliation: ReconcileProcessingHoldsService,
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
      for (const failure of await this.reconciliation.run()) {
        this.logger.warn(
          `Hold ${failure.holdId} reconciliation skipped: ${failure.error instanceof Error ? failure.error.message : String(failure.error)}`,
        );
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
