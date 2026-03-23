import { describe, expect, it } from "vitest";
import { consumeRateLimit, requestIp } from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("extracts client ip from forwarding headers", () => {
    const req = new Request("https://example.test", {
      headers: {
        "x-forwarded-for": "203.0.113.9, 10.0.0.1",
      },
    });
    expect(requestIp(req)).toBe("203.0.113.9");
  });

  it("enforces limits and returns retry-after seconds", () => {
    const key = `test-rate-limit-${Date.now()}`;
    const first = consumeRateLimit({ key, limit: 1, windowMs: 5_000 });
    const second = consumeRateLimit({ key, limit: 1, windowMs: 5_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSec).toBeGreaterThan(0);
  });
});
