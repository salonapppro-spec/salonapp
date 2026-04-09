import { unstable_cache } from "next/cache";
import { headers } from "next/headers";

import type { Tenant } from "@/types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-server";

export const getTenant = unstable_cache(
  async (salonSlug: string): Promise<Tenant> => {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("salon_slug", salonSlug)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Tenant not found for salon_slug='${salonSlug}'`);
    return data as Tenant;
  },
  ["tenant-by-salon-slug"],
  { revalidate: 60 }
);

export function getSalonSlugFromHeaders(): string | null {
  const h = headers();
  const slug = h.get("x-salon-slug");
  if (!slug) return null;
  return slug;
}

export async function getTenantFromRequest(): Promise<Tenant | null> {
  const slug = getSalonSlugFromHeaders();
  if (!slug) return null;
  return await getTenant(slug);
}

