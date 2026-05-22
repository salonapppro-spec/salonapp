/**
 * lib/routing/rate-limit-response.ts
 *
 * 429 response builders for rate limiting.
 * Keeps response construction out of the rate-limit-routes logic.
 */

import { NextResponse } from "next/server";

/** HTML 429 — for token action paths opened directly in a browser (/api/confirm/*, /api/cancel/*) */
export function htmlRateLimitResponse(): NextResponse {
  return new NextResponse(
    "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Твърде много заявки</title></head>" +
      "<body style='font-family:system-ui;padding:2rem;max-width:24rem'>Моля, опитайте отново след минута.</body></html>",
    {
      status: 429,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "60",
      },
    }
  );
}

/** JSON 429 — for all other API routes */
export function jsonRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": "60" } }
  );
}
