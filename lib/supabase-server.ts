import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase сесия през HTTP-only бисквитки (Server Components, Route Handlers).
 * За bypass на RLS / админ записи ползвайте `lib/supabase-admin.ts`.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component — cookie store може да е read-only
        }
      },
    },
  });
}

/** @deprecated Ползвайте `createSupabaseServerClient` — същата имплементация. */
export async function createSupabaseServerClientWithCookies(): Promise<SupabaseClient | null> {
  return createSupabaseServerClient();
}
