export abstract class RateLimiter {
  /** Atomically consumes one unit from a fixed window. */
  abstract consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean>;
}
