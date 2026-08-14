import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_METADATA = 'ticket-overlord:rate-limit';

export type RateLimitIdentity = 'ip' | 'email' | 'token' | 'organization';

export interface RateLimitOptions {
  name: string;
  limit: number;
  windowSeconds: number;
  identities: RateLimitIdentity[];
}

/** Declares a distributed fixed-window limit for an HTTP handler. */
export const RateLimit = (options: RateLimitOptions): MethodDecorator =>
  SetMetadata(RATE_LIMIT_METADATA, options);
