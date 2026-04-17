import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { getExpensesBetween } from "@/lib/data";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const PostSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  supplier: z.string().max(200).optional(),
});

export async function GET(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from и to са задължителни (YYYY-MM-DD)" }, { status: 400 });
  }
  const rows = await getExpensesBetween(salonSlug, from, to);
  return NextResponse.json({ expenses: rows });
}

export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни" }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      salon_slug: salonSlug,
      date: parsed.data.date,
      amount: parsed.data.amount,
      description: parsed.data.description,
      supplier: parsed.data.supplier ?? null,
    })
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  return NextResponse.json({ expense: data });
}
