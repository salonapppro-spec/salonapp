import { NextResponse } from "next/server";
import { z } from "zod";

import { lookupClientByPhone } from "@/lib/data";
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

  const result = await lookupClientByPhone(salonSlug, parsed.data.phone);
  return NextResponse.json({ name: result.name, email: result.email });
}
