/**
 * lib/routing/rate-limit-routes.ts
 *
 * Declarative route rate-limit map + applyRouteRateLimits().
 * Returns a 429 NextResponse if any limit is exceeded, null otherwise.
 *
 * Must be called BEFORE any DB or auth work (fail-fast).
 */

import { type NextResponse } from "next/server";

import { logAbuseEvent } from "@/lib/abuse-log";
import { RATE } from "@/lib/rate-limit-policies";
import { applyRateLimit } from "@/lib/rate-limit";
import { htmlRateLimitResponse, jsonRateLimitResponse } from "./rate-limit-response";

type RouteRateRule = {
  test: (pathname: string, method: string) => boolean;
  key: (ip: string) => string;
  policy: (typeof RATE)[keyof typeof RATE];
  label: string;
};

/**
 * Declarative map — mirrors the if-chain in the original middleware.ts exactly.
 * Order does not matter (only one rule fires per request via break).
 */
const RULES: RouteRateRule[] = [
  {
    test: (p, m) => p === "/api/bookings" && m === "GET",
    key: (ip) => `bookings-get:${ip}`,
    policy: RATE.bookingGet,
    label: "bookings_get",
  },
  {
    test: (p, m) => p === "/api/bookings" && m === "POST",
    key: (ip) => `bookings-post:${ip}`,
    policy: RATE.bookingPost,
    label: "booking_post",
  },
  {
    test: (p, m) => p === "/api/leads" && m === "POST",
    key: (ip) => `leads-post:${ip}`,
    policy: RATE.leadsPost,
    label: "leads_post",
  },
  {
    test: (p, m) => p === "/api/consultation" && m === "POST",
    key: (ip) => `consultation-post:${ip}`,
    policy: RATE.consultationPost,
    label: "consultation_post",
  },
  {
    test: (p, m) => p === "/api/availability" && m === "GET",
    key: (ip) => `availability-get:${ip}`,
    policy: RATE.availabilityGet,
    label: "availability_get",
  },
  {
    test: (p, m) => p === "/api/services" && m === "GET",
    key: (ip) => `services-get:${ip}`,
    policy: RATE.servicesGet,
    label: "services_get",
  },
  {
    test: (p, m) => p === "/api/clients/lookup" && m === "GET",
    key: (ip) => `clients-lookup:${ip}`,
    policy: RATE.clientsLookupGet,
    label: "clients_lookup",
  },
  {
    test: (p, m) => p === "/api/gdpr/delete-request" && m === "POST",
    key: (ip) => `gdpr-delete:${ip}`,
    policy: RATE.gdprDeletePost,
    label: "gdpr_delete",
  },
  {
    test: (p, m) => p === "/api/gdpr/export" && m === "POST",
    key: (ip) => `gdpr-export:${ip}`,
    policy: RATE.gdprExportPost,
    label: "gdpr_export",
  },
  {
    test: (p, m) => p === "/api/gdpr/export/confirm" && m === "GET",
    key: (ip) => `gdpr-export-confirm:${ip}`,
    policy: RATE.gdprExportConfirm,
    label: "gdpr_export_confirm",
  },
  {
    test: (p, m) => p === "/api/track" && m === "POST",
    key: (ip) => `track-post:${ip}`,
    policy: RATE.trackPost,
    label: "track_post",
  },
  {
    test: (p, m) => p.startsWith("/api/confirm/") && (m === "GET" || m === "POST"),
    key: (ip) => `token-confirm:${ip}`,
    policy: RATE.tokenAction,
    label: "token_confirm",
  },
  {
    test: (p, m) => p.startsWith("/api/cancel/") && (m === "GET" || m === "POST"),
    key: (ip) => `token-cancel:${ip}`,
    policy: RATE.tokenAction,
    label: "token_cancel",
  },
  {
    test: (p) => p.startsWith("/api/cron/"),
    key: (ip) => `cron-route:${ip}`,
    policy: RATE.cronRoute,
    label: "cron_route",
  },
  {
    test: (p, m) => p === "/api/webhooks/stripe" && m === "POST",
    key: (ip) => `stripe-webhook:${ip}`,
    policy: RATE.stripeWebhookPost,
    label: "stripe_webhook",
  },
];

export async function applyRouteRateLimits(
  pathname: string,
  method: string,
  ip: string
): Promise<NextResponse | null> {
  for (const rule of RULES) {
    if (!rule.test(pathname, method)) continue;

    const result = await applyRateLimit(rule.key(ip), rule.policy.limit, rule.policy.windowMs);
    if (!result.ok) {
      logAbuseEvent({
        kind: "rate_limited",
        path: pathname,
        method,
        status: 429,
        ip,
        key: rule.label,
      });
      // Token action paths are opened directly in a browser — serve HTML
      if (pathname.startsWith("/api/confirm/") || pathname.startsWith("/api/cancel/")) {
        return htmlRateLimitResponse();
      }
      return jsonRateLimitResponse();
    }
    // Only one rule fires per request
    break;
  }
  return null;
}
