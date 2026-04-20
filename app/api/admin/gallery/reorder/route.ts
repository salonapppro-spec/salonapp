import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const BodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();
  let order = 0;
  for (const id of parsed.data.ids) {
    const { error } = await supabase
      .from("gallery")
      .update({ order_index: order })
      .eq("id", id)
      .eq("salon_slug", salonSlug);
    if (error) return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    order += 1;
  }

  revalidatePath(`/${salonSlug}`);
  return NextResponse.json({ ok: true });
}
