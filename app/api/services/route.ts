import { NextResponse } from "next/server";
import { z } from "zod";

import { getServices } from "@/lib/data";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";

const QuerySchema = z.object({
  salon_slug: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ salon_slug: url.searchParams.get("salon_slug") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing salon_slug" }, { status: 400 });
  }

  const gate = await assertTenantActiveForPublicApi(parsed.data.salon_slug);
  if (!gate.ok) return gate.response;

  const services = await getServices(parsed.data.salon_slug);
  return NextResponse.json({ services });
}

