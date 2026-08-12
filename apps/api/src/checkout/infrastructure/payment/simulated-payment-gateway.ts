import { Injectable } from '@nestjs/common';
import { PaymentGateway } from '../../application/ports/payment-gateway';
import type { PaymentOutcome } from '../../domain/checkout.types';

@Injectable()
export class SimulatedPaymentGateway extends PaymentGateway {
  process(outcome: PaymentOutcome): Promise<PaymentOutcome> {
    return Promise.resolve(outcome);
  }
}
