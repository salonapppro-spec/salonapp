import { NextResponse } from "next/server";

import { logAbuseEvent } from "@/lib/abuse-log";
import { clientIpFromHeaders } from "@/lib/rate-limit";

type TenantHeaderCheck =
  | { ok: true; salonSlug: string }
  | { ok: false; response: NextResponse };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function requireTenantFromHeaders(
  req: Request,
  opts?: { claimedSlug?: string | null; path?: string; method?: string }
): TenantHeaderCheck {
  const path = opts?.path ?? new URL(req.url).pathname;
  const method = opts?.method ?? "GET";
  const headerSlug = req.headers.get("x-salon-slug")?.trim() ?? "";

  if (!headerSlug || !SLUG_RE.test(headerSlug)) {
    logAbuseEvent({
      kind: "client_error",
      path,
      method,
      status: 400,
      ip: clientIpFromHeaders(req.headers),
      key: "tenant_context_missing",
      detail: "Missing or invalid x-salon-slug",
    });
    return { ok: false, response: NextResponse.json({ error: "Missing tenant context" }, { status: 400 }) };
  }

  const claimedSlug = opts?.claimedSlug?.trim();
  if (claimedSlug && claimedSlug !== headerSlug) {
    logAbuseEvent({
      kind: "client_error",
      path,
      method,
      status: 403,
      ip: clientIpFromHeaders(req.headers),
      key: "tenant_context_mismatch",
      detail: `claimed=${claimedSlug} header=${headerSlug}`,
    });
    return { ok: false, response: NextResponse.json({ error: "Tenant mismatch" }, { status: 403 }) };
  }

  return { ok: true, salonSlug: headerSlug };
}

