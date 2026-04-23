import { unstable_cache } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Tenant } from "@/types";

/** Tenant по `salon_slug`, кеш 60 s. Може да се анулира с revalidateTag(`tenant-${slug}`). */
export function getTenant(salon_slug: string): Promise<Tenant | null> {
  return unstable_cache(
    async (): Promise<Tenant | null> => {
      const supabase = createSupabaseServiceRoleClient();
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("salon_slug", salon_slug)
        .maybeSingle();
      if (error) return null;
      return data as Tenant | null;
    },
    [`tenant-${salon_slug}`],
    { revalidate: 60, tags: [`tenant-${salon_slug}`] }
  )();
}
