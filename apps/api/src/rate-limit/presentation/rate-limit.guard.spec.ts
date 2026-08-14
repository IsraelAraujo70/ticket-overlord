import { HttpException, type ExecutionContext } from '@nestjs/common';
import type { RateLimitOptions } from './rate-limit.decorator';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  const options: RateLimitOptions = {
    name: 'login',
    limit: 10,
    windowSeconds: 60,
    identities: ['ip', 'email'],
  };

  it('consumes hashed keys for every configured identity', async () => {
    const consume = jest.fn().mockResolvedValue(true);
    const guard = new RateLimitGuard(
      { get: jest.fn().mockReturnValue(options) },
      { consume },
    );

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(consume).toHaveBeenCalledTimes(2);
    expect(consume.mock.calls.flat().join(' ')).not.toContain(
      'user@example.com',
    );
    expect(consume).toHaveBeenCalledWith(
      expect.stringMatching(/^login:ip:/),
      10,
      60,
    );
    expect(consume).toHaveBeenCalledWith(
      expect.stringMatching(/^login:email:/),
      10,
      60,
    );
  });

  it('rejects the request when a counter is exhausted', async () => {
    const guard = new RateLimitGuard(
      { get: jest.fn().mockReturnValue(options) },
      {
        consume: jest.fn().mockResolvedValueOnce(true).mockResolvedValue(false),
      },
    );

    await expect(guard.canActivate(context())).rejects.toMatchObject<
      Partial<HttpException>
    >({ status: 429 });
  });
});

function context(): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    switchToHttp: () => ({
      getRequest: () => ({
        body: { email: 'User@Example.com' },
        ip: '203.0.113.10',
        socket: {},
      }),
    }),
  } as unknown as ExecutionContext;
}
