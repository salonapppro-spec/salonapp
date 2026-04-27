import { performSalonSlugRename } from "@/lib/perform-salon-slug-rename";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export async function renameTenantSlugAsSuperAdmin(oldSlug: string, newSlug: string): Promise<{ error?: string }> {
  const admin = createSupabaseServiceRoleClient();
  return performSalonSlugRename(admin, oldSlug, newSlug);
}
