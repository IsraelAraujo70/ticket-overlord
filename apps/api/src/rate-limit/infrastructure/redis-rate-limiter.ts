import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { RateLimiter } from '../application/rate-limiter';

const FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current <= tonumber(ARGV[2]) and 1 or 0
`;

@Injectable()
export class RedisRateLimiter
  extends RateLimiter
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisRateLimiter.name);
  private readonly client: RedisClientType;
  private readonly disabled: boolean;
  private connection?: Promise<void>;

  constructor(config: ConfigService) {
    super();
    this.disabled = config.get<string>('NODE_ENV') === 'test';
    this.client = createClient({ url: config.getOrThrow<string>('REDIS_URL') });
    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis rate limiter error: ${error.message}`);
    });
  }

  onModuleInit(): Promise<void> {
    this.connection = this.client.connect().then(() => undefined);
    return this.connection;
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }

  async consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    if (this.disabled) return true;
    await this.connection;
    const allowed = await this.client.eval(FIXED_WINDOW_SCRIPT, {
      keys: [`rate-limit:${key}`],
      arguments: [String(windowSeconds), String(limit)],
    });
    return allowed === 1;
  }
}
