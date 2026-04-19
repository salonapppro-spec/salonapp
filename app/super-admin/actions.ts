"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SUPER_ADMIN_SALON_COOKIE } from "@/lib/admin-tenant";
import { recoveryActionLinkForEmail } from "@/lib/owner-recovery-link";
import { CreateTenantSchema } from "@/schemas/tenant";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const ADMIN_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isSuperAdminRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  return user.app_metadata?.role === "super_admin";
}

async function requireSuperAdminUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Unauthorized");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isSuperAdminRole(user)) throw new Error("Unauthorized");
  return user;
}

/** Задава httpOnly контекст и отваря салонския админ (данните се четат със service role по slug). */
export async function enterSalonAdminContextAction(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!ADMIN_SLUG_RE.test(salonSlug)) throw new Error("Невалиден slug");

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("id").eq("salon_slug", salonSlug).maybeSingle();
  if (!data) throw new Error("Няма такъв тенант");

  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_SALON_COOKIE, salonSlug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/admin/dashboard");
}

export async function activateTenantManually(formData: FormData): Promise<void> {
  await requireSuperAdminUser();

  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");
  const months = Math.max(1, Number(formData.get("period_months") ?? 1));
  const now = new Date();
  const expiry = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
  const grace = new Date(expiry);
  grace.setDate(grace.getDate() + 30);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tenants")
    .update({ status: "active", payment_type: "bank", expiry_date: iso(expiry), grace_until_date: iso(grace) })
    .eq("salon_slug", salonSlug);
  if (error) throw new Error("Неуспешна активация");

  // Best effort informational email.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("owner_email,salon_name")
    .eq("salon_slug", salonSlug)
    .maybeSingle();
  const ownerEmail = (tenant as { owner_email?: string | null } | null)?.owner_email?.trim();
  if (ownerEmail && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
        to: [ownerEmail],
        subject: "SalonApp — активиран абонамент",
        html: `<p>Вашият салон <strong>${(tenant as { salon_name?: string | null } | null)?.salon_name ?? salonSlug}</strong> е активиран ръчно (банков план).</p><p>Период до: <strong>${iso(expiry)}</strong></p>`,
      }),
    }).catch(() => undefined);
  }

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${salonSlug}`);
}

export async function updateTenantBasics(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  // Само полетата от формата — primary_color и font се управляват от салонския админ
  const patch = {
    status: String(formData.get("status") ?? "active"),
    plan: String(formData.get("plan") ?? "standard"),
    template: String(formData.get("template") ?? "bloom"),
    facebook_pixel_id: String(formData.get("facebook_pixel_id") ?? "") || null,
    gtm_id: String(formData.get("gtm_id") ?? "") || null,
    owner_email: String(formData.get("owner_email") ?? "") || null,
    owner_phone: String(formData.get("owner_phone") ?? "") || null,
  };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("tenants").update(patch).eq("salon_slug", salonSlug);
  if (error) throw new Error("Неуспешен запис");

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${salonSlug}`);
}

function randomPassword(): string {
  return `${randomBytes(12).toString("base64url")}9!`;
}

export async function createTenantAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; slug?: string; ownerEmail?: string | null; setPasswordLink?: string | null }> {
  await requireSuperAdminUser();

  const parsed = CreateTenantSchema.safeParse({
    salon_slug: String(formData.get("salon_slug") ?? "").trim(),
    salon_name: String(formData.get("salon_name") ?? "").trim(),
    plan: String(formData.get("plan") ?? "standard"),
    template: String(formData.get("template") ?? "bloom"),
    owner_email: String(formData.get("owner_email") ?? "").trim() || undefined,
    owner_phone: String(formData.get("owner_phone") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: exists } = await supabase
    .from("tenants")
    .select("id")
    .eq("salon_slug", parsed.data.salon_slug)
    .maybeSingle();
  if (exists) return { ok: false, error: "Slug вече е зает." };

  const insert = {
    salon_slug: parsed.data.salon_slug,
    salon_name: parsed.data.salon_name,
    plan: parsed.data.plan,
    status: "trial",
    template: parsed.data.template,
    owner_email: parsed.data.owner_email ?? null,
    owner_phone: parsed.data.owner_phone ?? null,
    payment_type: "bank",
  };
  const { error } = await supabase.from("tenants").insert(insert);
  if (error) return { ok: false, error: "Неуспешно създаване на тенант." };

  let setPasswordLink: string | null = null;

  if (parsed.data.owner_email) {
    const created = await supabase.auth.admin.createUser({
      email: parsed.data.owner_email,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: {
        salon_slug: parsed.data.salon_slug,
        plan: parsed.data.plan,
        role: "owner",
      },
      app_metadata: {
        salon_slug: parsed.data.salon_slug,
        role: "owner",
      },
    });
    if (created.error) {
      return { ok: false, error: "Тенантът е създаден, но auth user не беше създаден." };
    }

    setPasswordLink = await recoveryActionLinkForEmail(parsed.data.owner_email);

    if (process.env.RESEND_API_KEY) {
      const linkBlock = setPasswordLink
        ? `<p><strong>Важно:</strong> паролата е генерирана автоматично. Задай я от този еднократен линк:</p><p><a href="${setPasswordLink}">Задай парола и влез в админ панела</a></p>`
        : `<p>За да зададеш парола, помоли супер админ да изпрати отново покана или ползвай „Forgot password“ от страницата за вход (ако е настроена в Supabase).</p>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
          to: [parsed.data.owner_email],
          subject: "Добре дошли в SalonApp",
          html: `<p>Профилът за <strong>${parsed.data.salon_name}</strong> е създаден.</p><p>Имейл за вход: ${parsed.data.owner_email}</p>${linkBlock}<p>След това можеш да настроиш сайта и графика в админ панела.</p>`,
        }),
      }).catch(() => undefined);
    }
  }

  revalidatePath("/super-admin");
  return {
    ok: true,
    slug: parsed.data.salon_slug,
    ownerEmail: parsed.data.owner_email ?? null,
    setPasswordLink,
  };
}
