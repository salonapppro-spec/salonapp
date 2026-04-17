/**
 * Best-effort in-memory rate limit (per Node isolate). For multi-region production,
 * replace with Redis / Upstash (see docs). Still limits abuse per instance.
 */
const buckets = new Map<string, { n: number; reset: number }>();

export function rateLimitOrThrow(key: string, limit: number, windowMs: number): { ok: true } | { ok: false } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { n: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.n += 1;
  if (b.n > limit) return { ok: false };
  return { ok: true };
}

export function clientIpFromHeaders(h: Headers): string {
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  const ri = h.get("x-real-ip");
  if (ri) return ri.trim();
  return "unknown";
}
