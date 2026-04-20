import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const PostSchema = z.object({
  url: z.string().url(),
});

export async function GET() {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("salon_slug", salonSlug)
    .order("order_index", { ascending: true });
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();
  const { count } = await supabase
    .from("gallery")
    .select("*", { count: "exact", head: true })
    .eq("salon_slug", salonSlug);
  const orderIndex = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("gallery")
    .insert({
      salon_slug: salonSlug,
      url: parsed.data.url,
      order_index: orderIndex,
      is_visible: true,
    })
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });

  revalidatePath(`/${salonSlug}`);
  return NextResponse.json({ item: data });
}
