import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { getPublicAppUrl } from "@/lib/site-url";

/** Еднократен линк за задаване на парола (след admin.createUser с random password). */
export async function recoveryActionLinkForEmail(email: string): Promise<string | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: trimmed,
    options: {
      redirectTo: `${getPublicAppUrl()}/admin/login`,
    },
  });

  if (error) return null;
  const link = (data as { properties?: { action_link?: string } } | null)?.properties?.action_link;
  return typeof link === "string" && link.length > 0 ? link : null;
}
