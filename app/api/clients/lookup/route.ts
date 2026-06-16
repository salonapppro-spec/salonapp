import { NextResponse } from "next/server";
import { z } from "zod";

import { lookupClientByPhone } from "@/lib/data";
import { normalizePhone } from "@/lib/phone";
import { applyRateLimit } from "@/lib/rate-limit";
import { RATE } from "@/lib/rate-limit-policies";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";
import { requireTenantFromHeaders } from "@/lib/tenant-request";

const QuerySchema = z.object({
  salon_slug: z.string().min(1),
  phone: z.string().min(3),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    salon_slug: url.searchParams.get("salon_slug") ?? "",
    phone: url.searchParams.get("phone") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const tenant = requireTenantFromHeaders(req, {
    claimedSlug: parsed.data.salon_slug,
    path: "/api/clients/lookup",
    method: "GET",
  });
  if (!tenant.ok) return tenant.response;
  const salonSlug = tenant.salonSlug;

  const gate = await assertTenantActiveForPublicApi(salonSlug);
  if (!gate.ok) return gate.response;

  // Per-phone limit (not just per-IP) — the existing IP-based limit
  // (rate-limit-routes.ts) doesn't stop someone rotating IPs from
  // enumerating many different phone numbers to discover which belong to
  // real clients (response shape leaks name+email on a hit) — audit
  // 2026-06-15/16.
  const normalizedPhone = normalizePhone(parsed.data.phone) || parsed.data.phone.trim();
  const phoneLimit = RATE.clientsLookupPerPhone;
  const phoneRate = await applyRateLimit(`clients-lookup-phone:${salonSlug}:${normalizedPhone}`, phoneLimit.limit, phoneLimit.windowMs);
  if (!phoneRate.ok) {
    return NextResponse.json({ error: "Твърде много заявки. Опитайте по-късно." }, { status: 429 });
  }

  const result = await lookupClientByPhone(salonSlug, parsed.data.phone);
  return NextResponse.json({ name: result.name, email: result.email });
}
