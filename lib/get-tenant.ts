import { unstable_cache } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Tenant } from "@/types";

const getTenantCached = unstable_cache(
  async (salon_slug: string): Promise<Tenant | null> => {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase.from("tenants").select("*").eq("salon_slug", salon_slug).maybeSingle();
    if (error) return null;
    return data as Tenant | null;
  },
  ["get-tenant-by-salon-slug"],
  { revalidate: 60 }
);

/** Tenant по `salon_slug`, кеш 60 s (Next.js Data Cache). */
export function getTenant(salon_slug: string): Promise<Tenant | null> {
  return getTenantCached(salon_slug);
}
