import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { GetPublishedEventService } from './application/get-published-event.service';
import { PaymentService } from './application/payment.service';
import { CheckoutStore } from './application/ports/checkout-store';
import { PaymentGateway } from './application/ports/payment-gateway';
import { ReservationService } from './application/reservation.service';
import { SimulatedPaymentGateway } from './infrastructure/payment/simulated-payment-gateway';
import { PostgresCheckoutStore } from './infrastructure/persistence/postgres-checkout-store';
import { CheckoutExceptionFilter } from './presentation/checkout-exception.filter';
import { PublishedEventController } from './presentation/published-event.controller';
import { ReservationsController } from './presentation/reservations.controller';

@Module({
  imports: [AuthModule, DatabaseModule, EventsModule],
  controllers: [PublishedEventController, ReservationsController],
  providers: [
    GetPublishedEventService,
    ReservationService,
    PaymentService,
    CheckoutExceptionFilter,
    { provide: CheckoutStore, useClass: PostgresCheckoutStore },
    { provide: PaymentGateway, useClass: SimulatedPaymentGateway },
  ],
})
export class CheckoutModule {}
