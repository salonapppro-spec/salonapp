"use server";

import { randomBytes } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SUPER_ADMIN_SALON_COOKIE } from "@/lib/admin-tenant";
import { recoveryActionLinkForEmail } from "@/lib/owner-recovery-link";
import { CreateTenantSchema } from "@/schemas/tenant";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const ADMIN_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60;

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

async function logTenantActivity(params: {
  salonSlug: string;
  eventType: string;
  actorUserId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("tenant_activity_logs").insert({
    salon_slug: params.salonSlug,
    event_type: params.eventType,
    actor_user_id: params.actorUserId ?? null,
    payload: params.payload ?? {},
  });
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
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  });
  redirect("/admin/dashboard");
}

/** Изчиства super-admin impersonation контекста и връща към super-admin таблото. */
export async function exitSalonAdminContextAction(): Promise<void> {
  await requireSuperAdminUser();
  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_SALON_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/super-admin");
}

export async function activateTenantManually(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();

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
  await logTenantActivity({
    salonSlug,
    eventType: "manual_activation",
    actorUserId: user.id,
    payload: { months, expiry_date: iso(expiry), grace_until_date: iso(grace) },
  });

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

export async function archiveTenantAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tenants")
    .update({ archived_at: new Date().toISOString(), archived_by: user.id, status: "inactive" })
    .eq("salon_slug", salonSlug);
  if (error) throw new Error(`Неуспешно архивиране: ${error.message}`);
  await logTenantActivity({
    salonSlug,
    eventType: "tenant_archived",
    actorUserId: user.id,
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${salonSlug}`);
}

export async function restoreTenantAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tenants")
    .update({ archived_at: null, archived_by: null, status: "active" })
    .eq("salon_slug", salonSlug)
    .not("archived_at", "is", null);
  if (error) throw new Error(`Неуспешно възстановяване: ${error.message}`);
  await logTenantActivity({
    salonSlug,
    eventType: "tenant_restored",
    actorUserId: user.id,
    payload: { status: "active" },
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${salonSlug}`);
}

const VALID_TEMPLATES = new Set(["bloom", "luxe", "luxe2", "clean", "bold", "zen", "groom"]);
const VALID_STATUSES  = new Set(["trial", "active", "inactive"]);
const VALID_PLANS     = new Set(["starter", "standard", "pro", "premium"]);

export async function updateTenantBasics(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const template = String(formData.get("template") ?? "bloom");
  const status   = String(formData.get("status") ?? "active");
  const plan     = String(formData.get("plan") ?? "starter");

  // Guard against invalid values that would break DB CHECK constraints
  if (!VALID_TEMPLATES.has(template)) throw new Error(`Невалиден шаблон: ${template}`);
  if (!VALID_STATUSES.has(status))   throw new Error(`Невалиден статус: ${status}`);
  if (!VALID_PLANS.has(plan))        throw new Error(`Невалиден план: ${plan}`);

  const patch = {
    status,
    plan,
    template,
    facebook_pixel_id: String(formData.get("facebook_pixel_id") ?? "") || null,
    gtm_id:            String(formData.get("gtm_id") ?? "")            || null,
    owner_email:       String(formData.get("owner_email") ?? "")       || null,
    owner_phone:       String(formData.get("owner_phone") ?? "")       || null,
  };

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("tenants").update(patch).eq("salon_slug", salonSlug);
  if (error) throw new Error(`Неуспешен запис: ${error.message}`);
  await logTenantActivity({
    salonSlug,
    eventType: "tenant_basics_updated",
    actorUserId: user.id,
    payload: { status, plan, template },
  });

  revalidateTag(`tenant-${salonSlug}`);
  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${salonSlug}`);
  revalidatePath(`/${salonSlug}`); // публичен сайт на салона — обновява се веднага
  redirect(`/super-admin/${salonSlug}?saved=1`);
}

export async function extendTenantGraceBy7DaysAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const supabase = createSupabaseServiceRoleClient();
  const { data: tenant, error: loadError } = await supabase
    .from("tenants")
    .select("grace_until_date")
    .eq("salon_slug", salonSlug)
    .maybeSingle();
  if (loadError) throw new Error(`Неуспешно зареждане: ${loadError.message}`);

  const base = (tenant as { grace_until_date?: string | null } | null)?.grace_until_date;
  const fromDate = base ? new Date(`${base}T00:00:00`) : new Date();
  fromDate.setDate(fromDate.getDate() + 7);
  const nextGrace = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}-${String(fromDate.getDate()).padStart(2, "0")}`;

  const { error } = await supabase.from("tenants").update({ grace_until_date: nextGrace }).eq("salon_slug", salonSlug);
  if (error) throw new Error(`Неуспешно удължаване: ${error.message}`);

  await logTenantActivity({
    salonSlug,
    eventType: "grace_extended_7d",
    actorUserId: user.id,
    payload: { grace_until_date: nextGrace },
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${salonSlug}`);
  redirect(`/super-admin?op=grace_extended&salon=${encodeURIComponent(salonSlug)}`);
}

export async function markTenantActiveAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const supabase = createSupabaseServiceRoleClient();
  const { data: current } = await supabase
    .from("tenants")
    .select("status,archived_at")
    .eq("salon_slug", salonSlug)
    .maybeSingle();
  const currentStatus = (current as { status?: string; archived_at?: string | null } | null)?.status ?? "inactive";
  const currentArchivedAt = (current as { status?: string; archived_at?: string | null } | null)?.archived_at ?? null;
  if (currentStatus === "active" && !currentArchivedAt) {
    redirect(`/super-admin?op=already_active&salon=${encodeURIComponent(salonSlug)}`);
  }

  const { error } = await supabase
    .from("tenants")
    .update({ status: "active", archived_at: null, archived_by: null })
    .eq("salon_slug", salonSlug);
  if (error) throw new Error(`Неуспешна активация: ${error.message}`);

  await logTenantActivity({
    salonSlug,
    eventType: "tenant_marked_active",
    actorUserId: user.id,
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${salonSlug}`);
  redirect(`/super-admin?op=marked_active&salon=${encodeURIComponent(salonSlug)}`);
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
    plan: String(formData.get("plan") ?? "starter"),
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

  const notifyEmail = process.env.SUPER_ADMIN_EMAIL;
  if (notifyEmail && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
        to: [notifyEmail],
        subject: `Нов тенант: ${parsed.data.salon_name}`,
        html: `<p>Създаден е нов тенант в SalonApp.</p>
<table style="border-collapse:collapse;font-family:Arial,sans-serif">
  <tr><td style="padding:6px 12px 6px 0;color:#666">Салон</td><td style="padding:6px 0;font-weight:600">${parsed.data.salon_name}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666">Slug</td><td style="padding:6px 0">${parsed.data.salon_slug}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666">План</td><td style="padding:6px 0">${parsed.data.plan}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666">Имейл</td><td style="padding:6px 0">${parsed.data.owner_email ?? "—"}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666">Телефон</td><td style="padding:6px 0">${parsed.data.owner_phone ?? "—"}</td></tr>
</table>`,
      }),
    }).catch(() => undefined);
  }

  revalidatePath("/super-admin");
  return {
    ok: true,
    slug: parsed.data.salon_slug,
    ownerEmail: parsed.data.owner_email ?? null,
    setPasswordLink,
  };
}

