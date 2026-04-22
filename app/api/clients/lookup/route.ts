import { NextResponse } from "next/server";
import { z } from "zod";

import { lookupClientByPhone } from "@/lib/data";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";

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

  const gate = await assertTenantActiveForPublicApi(parsed.data.salon_slug);
  if (!gate.ok) return gate.response;

  const result = await lookupClientByPhone(parsed.data.salon_slug, parsed.data.phone);
  return NextResponse.json({ name: result.name });
}
