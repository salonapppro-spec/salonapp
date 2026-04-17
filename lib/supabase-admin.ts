import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service role client — само на сървъра (Route Handlers, Server Actions, фонови задачи).
 * Никога не се импортира от `"use client"` компоненти.
 */
export function createSupabaseServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Липсват NEXT_PUBLIC_SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
