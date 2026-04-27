import { redirect } from "next/navigation";

import { resolveAdminTenantSlug } from "@/lib/admin-tenant";

/** Server Components under /admin/(protected): redirect if session/JWT cannot resolve tenant. */
export async function requireAdminTenantSlugForPage(): Promise<string> {
  const slug = await resolveAdminTenantSlug();
  if (!slug) redirect("/admin/login?tenant_required=1");
  return slug;
}
