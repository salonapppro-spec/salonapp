import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminCapabilityForApi } from "@/lib/admin-rbac";
import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";

const PostSchema = z.object({
  url: z.string().url(),
});

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const { data, error } = await tenantDb(salonSlug).gallery.listAll();
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const a = await requireAdminCapabilityForApi("gallery_write");
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { count } = await tenantDb(salonSlug).gallery.count();
  const orderIndex = (count ?? 0) + 1;

  const { data, error } = await tenantDb(salonSlug).gallery.create({
    url: parsed.data.url,
    order_index: orderIndex,
    is_visible: true,
  });
  if (error) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });

  revalidatePath(`/${salonSlug}`);
  revalidateTag(`gallery-${salonSlug}`);
  return NextResponse.json({ item: data });
}
