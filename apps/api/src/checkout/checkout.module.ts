import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { GetPublishedEventService } from './application/get-published-event.service';
import { PaymentService } from './application/payment.service';
import {
  ConfirmedReservationReader,
  InventorySnapshotReader,
  InventorySynchronizer,
  PaymentConfirmationStore,
  PaymentReconciliationStore,
  PublishedEventReader,
} from './application/ports/confirmed-checkout-store';
import {
  HoldMaintenanceStore,
  HoldReconciliationStore,
  InventoryAvailabilityStore,
  PaymentHoldStore,
  ReservationHoldStore,
} from './application/ports/inventory-hold-store';
import { PaymentGateway } from './application/ports/payment-gateway';
import { ReservationService } from './application/reservation.service';
import { ReconcileProcessingHoldsService } from './application/reconcile-processing-holds.service';
import { SimulatedPaymentGateway } from './infrastructure/payment/simulated-payment-gateway';
import { PostgresCheckoutStore } from './infrastructure/persistence/postgres-checkout-store';
import { HoldMaintenanceService } from './infrastructure/redis/hold-maintenance.service';
import { RedisInventoryHoldStore } from './infrastructure/redis/redis-inventory-hold-store';
import { CheckoutExceptionFilter } from './presentation/checkout-exception.filter';
import { PublishedEventController } from './presentation/published-event.controller';
import { ReservationsController } from './presentation/reservations.controller';
import { HOLD_POLICY } from './checkout.constants';
import { DEFAULT_HOLD_POLICY } from './domain/hold-policy';

@Module({
  imports: [AuthModule, DatabaseModule, EventsModule],
  controllers: [PublishedEventController, ReservationsController],
  providers: [
    GetPublishedEventService,
    ReservationService,
    PaymentService,
    ReconcileProcessingHoldsService,
    CheckoutExceptionFilter,
    { provide: HOLD_POLICY, useValue: DEFAULT_HOLD_POLICY },
    PostgresCheckoutStore,
    { provide: PublishedEventReader, useExisting: PostgresCheckoutStore },
    { provide: InventorySnapshotReader, useExisting: PostgresCheckoutStore },
    { provide: InventorySynchronizer, useExisting: PostgresCheckoutStore },
    {
      provide: ConfirmedReservationReader,
      useExisting: PostgresCheckoutStore,
    },
    { provide: PaymentConfirmationStore, useExisting: PostgresCheckoutStore },
    {
      provide: PaymentReconciliationStore,
      useExisting: PostgresCheckoutStore,
    },
    RedisInventoryHoldStore,
    {
      provide: InventoryAvailabilityStore,
      useExisting: RedisInventoryHoldStore,
    },
    { provide: ReservationHoldStore, useExisting: RedisInventoryHoldStore },
    { provide: PaymentHoldStore, useExisting: RedisInventoryHoldStore },
    { provide: HoldReconciliationStore, useExisting: RedisInventoryHoldStore },
    { provide: HoldMaintenanceStore, useExisting: RedisInventoryHoldStore },
    HoldMaintenanceService,
    { provide: PaymentGateway, useClass: SimulatedPaymentGateway },
  ],
})
export class CheckoutModule {}
