import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { lookupClientByPhone } from "@/lib/data";

const QuerySchema = z.object({
  phone: z.string().min(3),
});

export async function GET(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    phone: url.searchParams.get("phone") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ name: null, email: null });
  }

  const result = await lookupClientByPhone(salonSlug, parsed.data.phone);
  return NextResponse.json({ name: result.name, email: result.email });
}
