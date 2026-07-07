"use server";

import { randomBytes } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { clientIpFromHeaders } from "@/lib/rate-limit";
import { SUPER_ADMIN_SALON_COOKIE, signImpersonationSlug } from "@/lib/admin-tenant";
import { recoveryActionLinkForEmail } from "@/lib/owner-recovery-link";
import { CreateTenantSchema, UpdateTenantBasicsSchema } from "@/schemas/tenant";
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

/**
 * Търси auth потребител по имейл през ВСИЧКИ страници на listUsers —
 * default-ът е 50/страница и търсенето пропускаше потребители след 50-ия
 * (одит D1). Supabase Admin API няма lookup по имейл, затова пагинираме.
 */
async function findAuthUserByEmail(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  email: string
): Promise<{ id: string } | null> {
  const target = email.trim().toLowerCase();
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Неуспешно четене на auth потребители: ${error.message}`);
    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (users.length < perPage) return null;
  }
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
  const user = await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!ADMIN_SLUG_RE.test(salonSlug)) throw new Error("Невалиден slug");

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("id").eq("salon_slug", salonSlug).maybeSingle();
  if (!data) throw new Error("Няма такъв тенант");

  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_SALON_COOKIE, signImpersonationSlug(salonSlug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  });

  // Audit trail for impersonation — previously unlogged (audit 2026-06-15/16).
  const h = await headers();
  await logTenantActivity({
    salonSlug,
    eventType: "super_admin_impersonation_start",
    actorUserId: user.id,
    payload: { ip: clientIpFromHeaders(h) },
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

export async function updateTenantBasics(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();

  // Zod schema instead of manual Set-based guards (audit 2026-06-15/16:
  // most super-admin FormData actions only did manual string parsing —
  // this one has the most free-text fields, so the highest risk of
  // partial/invalid writes hitting the DB CHECK constraints).
  const parsed = UpdateTenantBasicsSchema.safeParse({
    salon_slug: String(formData.get("salon_slug") ?? "").trim(),
    template: String(formData.get("template") ?? "bloom"),
    status: String(formData.get("status") ?? "active"),
    plan: String(formData.get("plan") ?? "starter"),
    salon_name: String(formData.get("salon_name") ?? ""),
    facebook_pixel_id: String(formData.get("facebook_pixel_id") ?? ""),
    gtm_id: String(formData.get("gtm_id") ?? ""),
    ga4_measurement_id: String(formData.get("ga4_measurement_id") ?? ""),
    gsc_verification_token: String(formData.get("gsc_verification_token") ?? ""),
    owner_email: String(formData.get("owner_email") ?? ""),
    owner_phone: String(formData.get("owner_phone") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Невалидни данни");
  }
  const {
    salon_slug: salonSlug,
    template,
    status,
    plan,
    salon_name: salonName,
    facebook_pixel_id,
    gtm_id,
    ga4_measurement_id,
    gsc_verification_token,
    owner_email,
    owner_phone,
  } = parsed.data;

  const patch = {
    status,
    plan,
    template,
    ...(salonName ? { salon_name: salonName } : {}),
    facebook_pixel_id: facebook_pixel_id || null,
    gtm_id: gtm_id || null,
    ga4_measurement_id: ga4_measurement_id || null,
    gsc_verification_token: gsc_verification_token || null,
    owner_email: owner_email || null,
    owner_phone: owner_phone || null,
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

export async function resendOwnerPasswordLinkAction(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const supabase = createSupabaseServiceRoleClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("owner_email,salon_name")
    .eq("salon_slug", salonSlug)
    .maybeSingle();
  const ownerEmail = (tenant as { owner_email?: string | null; salon_name?: string } | null)?.owner_email?.trim();
  const salonName = (tenant as { owner_email?: string | null; salon_name?: string } | null)?.salon_name ?? salonSlug;
  if (!ownerEmail) throw new Error("Тенантът няма имейл");

  const link = await recoveryActionLinkForEmail(ownerEmail);
  if (!link) throw new Error("Неуспешно генериране на линк");

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
        to: [ownerEmail],
        subject: "SalonApp — задай парола за достъп",
        html: `<p>Здравейте,</p><p>Ето еднократен линк за задаване на парола за вашия акаунт в <strong>${salonName}</strong>:</p><p><a href="${link}">Задай парола →</a></p><p>Линкът е валиден 1 час. Ако изтече, помолете администратора да изпрати нов.</p>`,
      }),
    }).catch(() => undefined);
  }

  revalidatePath(`/super-admin/${salonSlug}`);
  redirect(`/super-admin/${salonSlug}?op=link_sent`);
}

export async function sendCredentialsAction(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const supabase = createSupabaseServiceRoleClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("owner_email,salon_name")
    .eq("salon_slug", salonSlug)
    .maybeSingle();
  const ownerEmail = (tenant as { owner_email?: string | null; salon_name?: string } | null)?.owner_email?.trim();
  const salonName = (tenant as { owner_email?: string | null; salon_name?: string } | null)?.salon_name ?? salonSlug;
  if (!ownerEmail) throw new Error("Тенантът няма имейл");

  const authUser = await findAuthUserByEmail(supabase, ownerEmail);
  if (!authUser) throw new Error("Auth потребителят не е намерен в Supabase");

  const newPassword = randomPassword();
  const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });
  if (updateErr) throw new Error(`Неуспешна смяна на парола: ${updateErr.message}`);

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro"}/admin/login`;

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
        to: [ownerEmail],
        subject: "SalonApp — данни за вход в админ панела",
        html: buildCredentialsEmail(salonName, ownerEmail, newPassword, loginUrl),
      }),
    }).catch(() => undefined);
  }

  await logTenantActivity({
    salonSlug,
    eventType: "credentials_sent",
    actorUserId: (await requireSuperAdminUser()).id,
    payload: { ownerEmail },
  });

  revalidatePath(`/super-admin/${salonSlug}`);
  redirect(`/super-admin/${salonSlug}?op=credentials_sent`);
}

function buildCredentialsEmail(salonName: string, email: string, password: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#3D2B1F;padding:48px 40px;text-align:center;">
            <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#D4B8A8;">Вашият профил е готов</p>
            <h1 style="margin:0;font-size:32px;font-weight:700;color:#FFF8F5;letter-spacing:-0.5px;">SalonApp<span style="color:#C8826A;">.pro</span></h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#2d3748;line-height:1.7;">
              Здравейте, <strong>${salonName}</strong>,
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.7;">
              Вашият профил в SalonApp е готов. По-долу ще намерите данните за вход в админ панела.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2d9d0;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="background:#FFF8F5;padding:14px 20px;border-bottom:1px solid #e2d9d0;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8F5644;">Потребителско име (имейл)</p>
                  <p style="margin:0;font-size:16px;color:#2d3748;font-family:monospace;">${email}</p>
                </td>
              </tr>
              <tr>
                <td style="background:#FFF8F5;padding:14px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8F5644;">Парола</p>
                  <p style="margin:0;font-size:16px;color:#2d3748;font-family:monospace;">${password}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="text-align:center;">
                  <a href="${loginUrl}" style="display:inline-block;background:#3D2B1F;color:#FFF8F5;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:10px;letter-spacing:0.05em;">
                    Влез в админ панела →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#718096;line-height:1.6;text-align:center;">
              Препоръчваме Ви да смените паролата след първото влизане.<br/>
              При въпроси пишете на <a href="mailto:salonapppro@gmail.com" style="color:#B36B52;text-decoration:none;font-weight:600;">salonapppro@gmail.com</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8f8f8;border-top:1px solid #e8e8e8;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:14px;color:#718096;">Екипът на SalonApp</p>
            <a href="mailto:salonapppro@gmail.com" style="font-size:13px;color:#B36B52;text-decoration:none;font-weight:600;">salonapppro@gmail.com</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function deleteTenantAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdminUser();
  const salonSlug = String(formData.get("salon_slug") ?? "").trim();
  if (!salonSlug) throw new Error("Missing salon_slug");

  const supabase = createSupabaseServiceRoleClient();

  // Allow deletion only for archived tenants.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id,archived_at,owner_email")
    .eq("salon_slug", salonSlug)
    .maybeSingle();
  if (!tenant) throw new Error("Тенантът не съществува");
  const { archived_at, owner_email } = tenant as { id: string; archived_at: string | null; owner_email: string | null };
  if (!archived_at) throw new Error("Може да се изтриват само архивирани тенанти");

  await logTenantActivity({
    salonSlug,
    eventType: "tenant_deleted",
    actorUserId: user.id,
    payload: { owner_email },
  });

  const { error } = await supabase.from("tenants").delete().eq("salon_slug", salonSlug);
  if (error) throw new Error(`Неуспешно изтриване: ${error.message}`);

  // Best-effort: delete auth user if they exist.
  if (owner_email) {
    try {
      const authUser = await findAuthUserByEmail(supabase, owner_email);
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }
    } catch {
      // Тенантът вече е изтрит — провал тук не бива да гърми целия flow.
    }
  }

  revalidatePath("/super-admin");
  redirect("/super-admin?op=tenant_deleted&salon=" + encodeURIComponent(salonSlug));
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

