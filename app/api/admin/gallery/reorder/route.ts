import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminCapabilityForApi } from "@/lib/admin-rbac";
import { tenantDb } from "@/lib/tenant-db";

const BodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export async function POST(req: Request) {
  const a = await requireAdminCapabilityForApi("gallery_write");
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  let order = 0;
  for (const id of parsed.data.ids) {
    const { error } = await tenantDb(salonSlug).gallery.updateOrderById(id, order);
    if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    order += 1;
  }

  revalidatePath(`/${salonSlug}`);
  revalidateTag(`gallery-${salonSlug}`);
  return NextResponse.json({ ok: true });
}
