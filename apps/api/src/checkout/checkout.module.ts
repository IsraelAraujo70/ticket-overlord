import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { TicketsModule } from '../tickets/tickets.module';
import { GetPublishedEventService } from './application/get-published-event.service';
import { PaymentService } from './application/payment.service';
import { ConfirmedCheckoutStore } from './application/ports/confirmed-checkout-store';
import { InventoryHoldStore } from './application/ports/inventory-hold-store';
import { PaymentGateway } from './application/ports/payment-gateway';
import { ReservationService } from './application/reservation.service';
import { SimulatedPaymentGateway } from './infrastructure/payment/simulated-payment-gateway';
import { PostgresCheckoutStore } from './infrastructure/persistence/postgres-checkout-store';
import { HoldMaintenanceService } from './infrastructure/redis/hold-maintenance.service';
import { RedisInventoryHoldStore } from './infrastructure/redis/redis-inventory-hold-store';
import { CheckoutExceptionFilter } from './presentation/checkout-exception.filter';
import { PublishedEventController } from './presentation/published-event.controller';
import { ReservationsController } from './presentation/reservations.controller';

@Module({
  imports: [AuthModule, DatabaseModule, EventsModule, TicketsModule],
  controllers: [PublishedEventController, ReservationsController],
  providers: [
    GetPublishedEventService,
    ReservationService,
    PaymentService,
    CheckoutExceptionFilter,
    { provide: ConfirmedCheckoutStore, useClass: PostgresCheckoutStore },
    { provide: InventoryHoldStore, useClass: RedisInventoryHoldStore },
    HoldMaintenanceService,
    { provide: PaymentGateway, useClass: SimulatedPaymentGateway },
  ],
})
export class CheckoutModule {}
