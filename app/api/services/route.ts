import { NextResponse } from "next/server";
import { z } from "zod";

import { getServices } from "@/lib/data";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";
import { requireTenantFromHeaders } from "@/lib/tenant-request";

const QuerySchema = z.object({
  salon_slug: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const querySlug = url.searchParams.get("salon_slug") ?? "";
  const parsed = QuerySchema.safeParse({ salon_slug: querySlug });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing salon_slug" }, { status: 400 });
  }

  const tenant = requireTenantFromHeaders(req, { claimedSlug: parsed.data.salon_slug, path: "/api/services", method: "GET" });
  if (!tenant.ok) return tenant.response;
  const salonSlug = tenant.salonSlug;

  const gate = await assertTenantActiveForPublicApi(salonSlug);
  if (!gate.ok) return gate.response;

  const services = await getServices(salonSlug);
  return NextResponse.json({ services });
}

