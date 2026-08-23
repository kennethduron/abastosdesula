interface RateLimitBucket {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()) {
    const cutoff = now - this.windowMs;
    const timestamps = (this.buckets.get(key)?.timestamps ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );
    if (timestamps.length >= this.limit) {
      return {
        allowed: false,
        retryAfterMs: timestamps[0] + this.windowMs - now,
      };
    }
    timestamps.push(now);
    this.buckets.set(key, { timestamps });
    if (this.buckets.size > 2_000) this.prune(now);
    return { allowed: true, retryAfterMs: 0 };
  }

  private prune(now: number) {
    const cutoff = now - this.windowMs;
    for (const [key, bucket] of this.buckets) {
      if (!bucket.timestamps.some((timestamp) => timestamp > cutoff)) {
        this.buckets.delete(key);
      }
    }
  }
}
