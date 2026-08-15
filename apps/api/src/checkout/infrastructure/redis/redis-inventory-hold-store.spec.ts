import { ConfigService } from '@nestjs/config';
import { DEFAULT_HOLD_POLICY } from '../../domain/hold-policy';
import { RedisInventoryHoldStore } from './redis-inventory-hold-store';

describe('RedisInventoryHoldStore', () => {
  it('fails closed when Redis is unavailable', async () => {
    const store = new RedisInventoryHoldStore(
      new ConfigService({ REDIS_URL: 'redis://127.0.0.1:6399' }),
      DEFAULT_HOLD_POLICY,
    );
    await store.onModuleInit();

    await expect(
      store.create({
        eventId: crypto.randomUUID(),
        customerId: crypto.randomUUID(),
        capacity: 10,
        confirmedQuantity: 0,
        priceInCents: 2_500,
        currency: 'BRL',
        quantity: 1,
      }),
    ).rejects.toMatchObject({ code: 'CHECKOUT_UNAVAILABLE' });

    await store.onApplicationShutdown();
  });
});
