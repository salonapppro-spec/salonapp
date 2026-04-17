import { NextResponse } from "next/server";

import { getTenantBySalonSlug } from "@/lib/data";

export async function assertTenantActiveForPublicApi(salonSlug: string): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const tenant = await getTenantBySalonSlug(salonSlug);
  if (!tenant) {
    return { ok: false, response: NextResponse.json({ error: "Salon not found" }, { status: 404 }) };
  }
  if (tenant.status !== "active" && tenant.status !== "trial") {
    return { ok: false, response: NextResponse.json({ error: "Salon unavailable" }, { status: 403 }) };
  }
  return { ok: true };
}
