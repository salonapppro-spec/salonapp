import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { getWorkingHoursWeekMerged, replaceWorkingHoursSalonDefault } from "@/lib/data";
import { WorkingHoursPutSchema } from "@/schemas/working-hours-admin";

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const days = await getWorkingHoursWeekMerged(salonSlug);
  return NextResponse.json({ days });
}

export async function PUT(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = WorkingHoursPutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    await replaceWorkingHoursSalonDefault(salonSlug, parsed.data.days);
  } catch {
    return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  }
  revalidateTag(`working-hours-${salonSlug}`);
  return NextResponse.json({ ok: true });
}
