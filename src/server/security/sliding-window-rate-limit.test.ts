import { describe, expect, it } from "vitest";

import { SlidingWindowRateLimiter } from "./sliding-window-rate-limit";

describe("SlidingWindowRateLimiter", () => {
  it("limits repeated public submissions and recovers after the window", () => {
    const limiter = new SlidingWindowRateLimiter(2, 1_000);
    expect(limiter.consume("ip", 0).allowed).toBe(true);
    expect(limiter.consume("ip", 10).allowed).toBe(true);
    expect(limiter.consume("ip", 20).allowed).toBe(false);
    expect(limiter.consume("ip", 1_001).allowed).toBe(true);
  });

  it("keeps independent keys isolated", () => {
    const limiter = new SlidingWindowRateLimiter(1, 1_000);
    expect(limiter.consume("a", 0).allowed).toBe(true);
    expect(limiter.consume("a", 1).allowed).toBe(false);
    expect(limiter.consume("b", 1).allowed).toBe(true);
  });
});
