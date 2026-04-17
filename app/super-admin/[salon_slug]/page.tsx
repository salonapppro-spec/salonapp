import Link from "next/link";
import { notFound } from "next/navigation";

import { activateTenantManually, enterSalonAdminContextAction, updateTenantBasics } from "@/app/super-admin/actions";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Tenant } from "@/types";

export default async function SuperAdminTenantPage({ params }: { params: { salon_slug: string } }) {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("*").eq("salon_slug", params.salon_slug).maybeSingle();
  const tenant = data as Tenant | null;
  if (!tenant) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = Boolean(tenant.expiry_date && tenant.expiry_date < today);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tenant.salon_name}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            `{tenant.salon_slug}` · статус: {tenant.status} · план: {tenant.plan}
          </p>
          <p className={overdue ? "mt-2 text-sm font-semibold text-red-300" : "mt-2 text-sm text-neutral-300"}>
            {overdue ? `Просрочен абонамент (изтекъл на ${tenant.expiry_date})` : tenant.expiry_date ? `Платен до ${tenant.expiry_date}` : "Няма зададен срок на абонамент"}
            {tenant.grace_until_date ? ` · grace до ${tenant.grace_until_date}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <form action={enterSalonAdminContextAction}>
            <input type="hidden" name="salon_slug" value={tenant.salon_slug} />
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              Салонски админ
            </button>
          </form>
          <Link href="/super-admin" className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
            ← обратно
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
        <h2 className="text-lg font-semibold">Управление на тенант</h2>
        <form action={updateTenantBasics} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="salon_slug" value={tenant.salon_slug} />

          <div>
            <label className="text-xs text-neutral-400">Статус</label>
            <select name="status" defaultValue={tenant.status} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="trial">trial</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400">План</label>
            <select name="plan" defaultValue={tenant.plan} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="standard">standard</option>
              <option value="pro">pro</option>
              <option value="premium">premium</option>
              <option value="collective">collective</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Шаблон</label>
            <select name="template" defaultValue={tenant.template} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="bloom">bloom</option>
              <option value="luxe">luxe</option>
              <option value="clean">clean</option>
              <option value="zen">zen</option>
              <option value="bold">bold</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Primary color</label>
            <input name="primary_color" type="color" defaultValue={tenant.primary_color ?? "#F2A58E"} className="mt-1 h-10 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1" />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Font</label>
            <select name="font" defaultValue={tenant.font ?? "Inter"} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="Inter">Inter</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Lato">Lato</option>
              <option value="Nunito Sans">Nunito Sans</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Oswald">Oswald</option>
            </select>
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
            <label className="text-xs text-neutral-400">CAPI token</label>
            <input name="capi_token" defaultValue={tenant.capi_token ?? ""} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-400">Clarity ID</label>
            <input name="clarity_id" defaultValue={tenant.clarity_id ?? ""} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-400">GTM ID</label>
            <input name="gtm_id" defaultValue={tenant.gtm_id ?? ""} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>

          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
              Запази
            </button>
          </div>
        </form>
        <form action={activateTenantManually} className="mt-3 flex items-end gap-3">
          <input type="hidden" name="salon_slug" value={tenant.salon_slug} />
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Период (месеци)</label>
            <select name="period_months" defaultValue="1" className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="1">1 месец</option>
              <option value="3">3 месеца</option>
              <option value="6">6 месеца</option>
              <option value="12">12 месеца</option>
            </select>
          </div>
          <button type="submit" className="rounded-lg border border-emerald-700 bg-emerald-950/50 px-4 py-2 text-sm font-semibold text-emerald-300">
            Поднови/активирай (bank)
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
        <h2 className="text-lg font-semibold">Stripe (временно info)</h2>
        <p className="mt-2 text-sm text-neutral-400">
          status: {tenant.status} · payment_type: {tenant.payment_type ?? "—"} · customer: {tenant.stripe_customer_id ?? "—"} · subscription:{" "}
          {tenant.stripe_subscription_id ?? "—"}
        </p>
      </section>
    </div>
  );
}
