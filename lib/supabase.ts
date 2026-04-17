import { createBrowserClient } from "@supabase/ssr";

/** Браузърен клиент (anon) — само в Client Components. */
export function createSupabaseBrowserClient() {
  // Във Vercel не маркирай NEXT_PUBLIC_* като „Sensitive“ — иначе не се вграждат в client bundle при build.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Липсват NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(url, anonKey);
}

