import { SimulatedPaymentGateway } from './simulated-payment-gateway';

describe('SimulatedPaymentGateway', () => {
  const gateway = new SimulatedPaymentGateway();

  it.each(['APPROVED', 'REFUSED'] as const)(
    'deterministically returns %s',
    async (outcome) => {
      await expect(gateway.process(outcome)).resolves.toBe(outcome);
    },
  );
});
