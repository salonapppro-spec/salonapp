import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

import { rateLimitOrThrow } from "@/lib/rate-limit-ip";

type RedisClient = InstanceType<typeof Redis>;

const redis: RedisClient | null = (() => {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    // `cloudflare` build is Edge-safe (no Node-only APIs). Use explicit config for strict TS.
    return new Redis({ url, token });
  } catch {
    return null;
  }
})();

const limiterCache = new Map<string, Ratelimit>();

function limiterKey(limit: number, windowSec: number): string {
  return `${limit}:${windowSec}`;
}

function getRatelimit(rdb: RedisClient, limit: number, windowSec: number): Ratelimit {
  const k = limiterKey(limit, windowSec);
  const existing = limiterCache.get(k);
  if (existing) return existing;

  const r = new Ratelimit({
    redis: rdb,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: `salonapp-rl/${k}`,
  });
  limiterCache.set(k, r);
  return r;
}

/**
 * Central rate limit: Upstash in production (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN), else in-memory.
 */
export async function applyRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: true } | { ok: false }> {
  const rdb = redis;
  if (!rdb) {
    return rateLimitOrThrow(key, limit, windowMs);
  }
  const windowSec = Math.max(1, Math.round(windowMs / 1000));
  const { success } = await getRatelimit(rdb, limit, windowSec).limit(key);
  if (!success) return { ok: false };
  return { ok: true };
}

export { clientIpFromHeaders, rateLimitOrThrow } from "@/lib/rate-limit-ip";
