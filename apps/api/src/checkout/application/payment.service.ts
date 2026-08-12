import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import type { PaymentOutcome, PaymentResult } from '../domain/checkout.types';
import { CheckoutStore } from './ports/checkout-store';
import { PaymentGateway } from './ports/payment-gateway';
import { requireCustomer } from './reservation.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly store: CheckoutStore,
    private readonly gateway: PaymentGateway,
  ) {}

  /** Processes or replays one idempotent simulated payment attempt. */
  async process(
    user: AuthenticatedUser,
    reservationId: string,
    idempotencyKey: string,
    requestedOutcome: PaymentOutcome,
  ): Promise<PaymentResult> {
    const customerId = requireCustomer(user);
    const outcome = await this.gateway.process(requestedOutcome);
    return this.store.processPayment({
      customerId,
      reservationId,
      idempotencyKey,
      outcome,
    });
  }
}
