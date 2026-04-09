import { createBrowserClient, createServerClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(url, anonKey);
}

/**
 * Server client for authenticated SSR (uses cookies).
 * Note: service-role operations must use `lib/supabase-server.ts`.
 */
export function createSupabaseServerClient(params: {
  getCookie: (name: string) => string | undefined;
  setCookie: (name: string, value: string, options: { path: string; maxAge?: number }) => void;
  removeCookie: (name: string, options: { path: string }) => void;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const { getCookie, setCookie, removeCookie } = params;

  return createServerClient(url, anonKey, {
    cookies: {
      get: (name) => getCookie(name),
      set: (name, value, options) => setCookie(name, value, { path: "/", maxAge: options.maxAge }),
      remove: (name, options) => removeCookie(name, { path: options.path ?? "/" }),
    },
  });
}

