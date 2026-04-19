import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "./copy-button";

import { activateTenantManually, enterSalonAdminContextAction, updateTenantBasics } from "@/app/super-admin/actions";
import { MARKETING_PLANS } from "@/lib/marketing-data";
import { stripePaymentLinkForPlan } from "@/lib/marketing-checkout";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Tenant } from "@/types";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:   { label: "Активен",    cls: "bg-emerald-900/60 text-emerald-300 border-emerald-700/60" },
  trial:    { label: "Пробен",     cls: "bg-amber-900/60 text-amber-300 border-amber-700/60" },
  inactive: { label: "Неактивен",  cls: "bg-red-900/60 text-red-300 border-red-700/60" },
};

const TEMPLATES = ["bloom", "luxe", "luxe2", "bold", "zen", "groom"];

export default async function SuperAdminTenantPage({ params }: { params: { salon_slug: string } }) {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("*").eq("salon_slug", params.salon_slug).maybeSingle();
  const tenant = data as Tenant | null;
  if (!tenant) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const overdue = Boolean(tenant.expiry_date && tenant.expiry_date < today);

  // Stripe link for their plan + prefilled email
  const planId = (tenant.plan ?? "standard") as Parameters<typeof stripePaymentLinkForPlan>[0];
  const baseStripeLink = stripePaymentLinkForPlan(planId);
  const stripeLink = baseStripeLink && tenant.owner_email
    ? `${baseStripeLink}?prefilled_email=${encodeURIComponent(tenant.owner_email)}`
    : baseStripeLink;

  // Stats
  const [{ count: bookingCount }, { count: clientCount }] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("salon_slug", tenant.salon_slug),
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("salon_slug", tenant.salon_slug),
  ]);

  const sb = STATUS_BADGE[tenant.status] ?? STATUS_BADGE.inactive;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{tenant.salon_name}</h1>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${sb.cls}`}>{sb.label}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            <code className="rounded bg-neutral-800 px-1">{tenant.salon_slug}</code>
            {" · "}{tenant.plan}{" · "}
            {tenant.template}
          </p>
          <p className={overdue ? "mt-1.5 text-sm font-semibold text-red-300" : "mt-1.5 text-sm text-neutral-400"}>
            {overdue
              ? `⚠️ Просрочен (${tenant.expiry_date})`
              : tenant.expiry_date
                ? `✓ Платен до ${tenant.expiry_date}`
                : "Без срок"}
            {tenant.grace_until_date ? ` · grace до ${tenant.grace_until_date}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={enterSalonAdminContextAction}>
            <input type="hidden" name="salon_slug" value={tenant.salon_slug} />
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              Влез в админа →
            </button>
          </form>
          <a
            href={`https://${tenant.salon_slug}.salonapp.pro`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Виж сайта ↗
          </a>
          <Link href="/super-admin" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
            ← Обратно
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Резервации", value: bookingCount ?? 0, color: "text-sky-300" },
          { label: "Клиенти", value: clientCount ?? 0, color: "text-violet-300" },
          { label: "План", value: tenant.plan, color: "text-amber-300" },
          { label: "Шаблон", value: tenant.template ?? "—", color: "text-rose-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">{s.label}</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Stripe payment link */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
        <h2 className="text-base font-semibold text-neutral-100">💳 Stripe линк за плащане</h2>
        {stripeLink ? (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg bg-neutral-950 px-3 py-2 text-xs text-emerald-300">{stripeLink}</code>
            <a
              href={stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Отвори ↗
            </a>
            <CopyButton text={stripeLink} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Stripe Payment Links не са конфигурирани в env. Задай{" "}
            <code className="text-neutral-400">NEXT_PUBLIC_STRIPE_PAYMENT_LINK_{planId.toUpperCase()}</code>.
          </p>
        )}
        <p className="mt-2 text-xs text-neutral-600">
          Имейлът на собственика е префилнат автоматично:{" "}
          <span className="text-neutral-400">{tenant.owner_email ?? "—"}</span>
        </p>
      </section>

      {/* Edit form */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
        <h2 className="text-base font-semibold text-neutral-100">⚙️ Настройки на тенант</h2>
        <form action={updateTenantBasics} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="salon_slug" value={tenant.salon_slug} />

          <div>
            <label className="text-xs text-neutral-400">Статус</label>
            <select name="status" defaultValue={tenant.status} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="trial">trial — Пробен</option>
              <option value="active">active — Активен</option>
              <option value="inactive">inactive — Неактивен</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400">План</label>
            <select name="plan" defaultValue={tenant.plan} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              {MARKETING_PLANS.map((p) => (
                <option key={p.id} value={p.id}>{p.id} — {p.name} ({p.priceMonthly} {p.priceCurrency})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Шаблон</label>
            <select name="template" defaultValue={tenant.template} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Цвят на сайта</label>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-8 w-8 rounded-lg border border-neutral-700 shrink-0"
                style={{ background: tenant.primary_color ?? "#F2A58E" }}
              />
              <span className="font-mono text-sm text-neutral-400">{tenant.primary_color ?? "#F2A58E"}</span>
              <span className="text-xs text-neutral-600">— управлява се от салона в техния админ панел</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Owner email</label>
            <input name="owner_email" defaultValue={tenant.owner_email ?? ""} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Owner phone</label>
            <input name="owner_phone" defaultValue={tenant.owner_phone ?? ""} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Facebook Pixel</label>
            <input name="facebook_pixel_id" defaultValue={tenant.facebook_pixel_id ?? ""} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-400">GTM ID</label>
            <input name="gtm_id" defaultValue={tenant.gtm_id ?? ""} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100">
              ✓ Запази промените
            </button>
          </div>
        </form>

        {/* Manual activation */}
        <div className="mt-5 border-t border-neutral-800 pt-5">
          <h3 className="text-sm font-semibold text-neutral-300">Ръчно активиране / подновяване (банков превод)</h3>
          <form action={activateTenantManually} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="salon_slug" value={tenant.salon_slug} />
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Период</label>
              <select name="period_months" defaultValue="1" className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
                <option value="1">1 месец</option>
                <option value="3">3 месеца</option>
                <option value="6">6 месеца</option>
                <option value="12">12 месеца</option>
              </select>
            </div>
            <button type="submit" className="rounded-lg border border-emerald-700 bg-emerald-950/50 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60">
              Активирай (bank)
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
