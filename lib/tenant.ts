import { headers } from "next/headers";

import { getTenant } from "@/lib/get-tenant";
import type { Tenant } from "@/types";

export { getTenant } from "@/lib/get-tenant";

export async function getSalonSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  const slug = h.get("x-salon-slug");
  if (!slug) return null;
  return slug;
}

export async function getTenantFromRequest(): Promise<Tenant | null> {
  const slug = await getSalonSlugFromHeaders();
  if (!slug) return null;
  return getTenant(slug);
}
