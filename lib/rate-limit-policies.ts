/**
 * Public API rate limits (per client IP, sliding window when using Upstash).
 * Aligned for abuse protection + UX; adjust via env in rate-limit module if needed.
 */
export const RATE = {
  bookingPost: { limit: 40, windowMs: 60_000 },
  /** GET /api/bookings (slot data) — same class as availability polling */
  bookingGet: { limit: 60, windowMs: 60_000 },
  leadsPost: { limit: 15, windowMs: 60_000 },
  consultationPost: { limit: 10, windowMs: 60_000 },
  availabilityGet: { limit: 60, windowMs: 60_000 },
  servicesGet: { limit: 30, windowMs: 60_000 },
  clientsLookupGet: { limit: 10, windowMs: 60_000 },
  gdprDeletePost: { limit: 3, windowMs: 60_000 },
  trackPost: { limit: 60, windowMs: 60_000 },
  /** Per IP for confirm/cancel token links (email clients + accidental refreshes) */
  tokenAction: { limit: 40, windowMs: 60_000 },
  /** createBooking server action (stricter than POST /api/bookings) */
  bookingAction: { limit: 10, windowMs: 60_000 },
  /**
   * GET /api/cron/* — допълва CRON_SECRET (401 без токен). Ограничава сканиране и DDoS към endpoint-а.
   * Легитимният Vercel Cron е рядък; при много job-ове на минута увеличи лимита или ползвай отделни deployment keys.
   */
  cronRoute: { limit: 45, windowMs: 60_000 },
  /**
   * POST /api/webhooks/stripe — допълва подписа на Stripe. Висок таван за retry burst от Stripe по същия egress IP.
   */
  stripeWebhookPost: { limit: 150, windowMs: 60_000 },
} as const;
