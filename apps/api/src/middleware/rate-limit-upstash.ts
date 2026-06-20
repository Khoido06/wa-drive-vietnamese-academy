import type { Context, Next } from "hono";
import { rateLimit as memoryRateLimit } from "./rate-limit.js";
import { logger } from "./logger.js";

type RatelimitClient = {
  limit: (key: string) => Promise<{ success: boolean; remaining: number; limit: number }>;
};

let upstashLimiter: RatelimitClient | null | undefined;

async function getUpstashLimiter(max: number, windowSec: number): Promise<RatelimitClient | null> {
  if (upstashLimiter !== undefined) return upstashLimiter;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashLimiter = null;
    return null;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    upstashLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      analytics: true,
      prefix: "wa-drive",
    });
    logger.info("rate limit backend", { backend: "upstash" });
    return upstashLimiter;
  } catch (err) {
    logger.warn("upstash unavailable, using in-memory rate limit", {
      error: err instanceof Error ? err.message : String(err),
    });
    upstashLimiter = null;
    return null;
  }
}

/** Upstash Redis when configured; falls back to in-memory (free). */
export function createRateLimit(opts: { windowMs: number; max: number; keyPrefix?: string }) {
  const memory = memoryRateLimit(opts);
  const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000));

  return async (c: Context, next: Next) => {
    const limiter = await getUpstashLimiter(opts.max, windowSec);
    if (!limiter) return memory(c, next);

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "anonymous";
    const key = `${opts.keyPrefix ?? "rl"}:${ip}`;

    const { success, remaining, limit } = await limiter.limit(key);
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Backend", "upstash");

    if (!success) {
      return c.json({ error: "Quá nhiều yêu cầu. Vui lòng đợi một chút." }, 429);
    }

    await next();
  };
}
