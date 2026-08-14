import { Module } from '@nestjs/common';
import { RateLimiter } from './application/rate-limiter';
import { RedisRateLimiter } from './infrastructure/redis-rate-limiter';
import { RateLimitGuard } from './presentation/rate-limit.guard';

@Module({
  providers: [
    RateLimitGuard,
    { provide: RateLimiter, useClass: RedisRateLimiter },
  ],
  exports: [RateLimiter, RateLimitGuard],
})
export class RateLimitModule {}
