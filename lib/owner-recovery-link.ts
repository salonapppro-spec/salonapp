import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { getPublicAppUrl } from "@/lib/site-url";

/** Еднократен линк за задаване на парола (след admin.createUser с random password). */
export async function recoveryActionLinkForEmail(email: string): Promise<string | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;

  const supabase = createSupabaseServiceRoleClient();
  const redirectTo = `${getPublicAppUrl()}/admin/reset-password`;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: trimmed,
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("[owner-recovery-link] generateLink failed", error.message);
    return null;
  }

  const payload = data as { properties?: { action_link?: string; hashed_token?: string } } | null;
  const actionLink = payload?.properties?.action_link;
  const hashedToken = payload?.properties?.hashed_token;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  if (supabaseUrl && hashedToken) {
    return `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(hashedToken)}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`;
  }

  if (typeof actionLink === "string" && actionLink.length > 0) {
    return actionLink;
  }

  console.error("[owner-recovery-link] missing link properties in generateLink response");
  return null;
}
