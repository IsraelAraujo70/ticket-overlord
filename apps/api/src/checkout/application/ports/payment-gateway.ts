import type { PaymentOutcome } from '../../domain/checkout.types';

export abstract class PaymentGateway {
  /** Resolves a deterministic simulation without external side effects. */
  abstract process(outcome: PaymentOutcome): Promise<PaymentOutcome>;
}
