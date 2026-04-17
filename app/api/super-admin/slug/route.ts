import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { requireSuperAdminForApi } from "@/lib/super-admin-auth";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(req: Request) {
  const auth = await requireSuperAdminForApi();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("id").eq("salon_slug", slug).maybeSingle();
  return NextResponse.json({ available: !data });
}
