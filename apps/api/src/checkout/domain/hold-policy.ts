export interface HoldPolicy {
  durationMs: number;
  processingTimeoutMs: number;
}

export const DEFAULT_HOLD_POLICY: HoldPolicy = {
  durationMs: 10 * 60 * 1000,
  processingTimeoutMs: 30 * 1000,
};
