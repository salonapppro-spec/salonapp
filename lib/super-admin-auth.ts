import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export function isSuperAdminRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  return user.app_metadata?.role === "super_admin";
}

export async function requireSuperAdminForApi(): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isSuperAdminRole(user)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}
