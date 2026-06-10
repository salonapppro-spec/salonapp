import Link from "next/link";

import { ArchiveTenantSubmitButton } from "./archive-tenant-submit-button";
import { DeleteTenantSubmitButton } from "./delete-tenant-submit-button";
import { VisitsChart } from "@/components/super-admin/VisitsChart";
import type { DailyEvent } from "@/components/super-admin/VisitsChart";

import {
  archiveTenantAction,
  deleteTenantAction,
  enterSalonAdminContextAction,
  extendTenantGraceBy7DaysAction,
  markTenantActiveAction,
  restoreTenantAction,
} from "@/app/super-admin/actions";
import { readPublicPlanPriceMonthly } from "@/lib/marketing-pricing-env";
import { MARKETING_PLANS } from "@/lib/marketing-data";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Tenant } from "@/types";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:   { label: "Активен",   cls: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60" },
  trial:    { label: "Пробен",    cls: "bg-amber-900/60 text-amber-300 border border-amber-700/60" },
  inactive: { label: "Неактивен", cls: "bg-red-900/60 text-red-300 border border-red-700/60" },
  archived: { label: "Архивиран", cls: "bg-neutral-800 text-neutral-200 border border-neutral-600" },
};

type SearchParams = { q?: string; plan?: string; status?: string; archived?: string; op?: string; salon?: string };

function plusDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function StatusBadge({ status }: { status: string }) {
  const sb = STATUS_BADGE[status] ?? STATUS_BADGE.inactive;
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sb.cls}`}>{sb.label}</span>;
}

function effectiveTenantStatus(t: Tenant): string {
  return t.archived_at ? "archived" : t.status;
}

function isOverdue(t: Tenant, today: string): boolean {
  if (!t.expiry_date) return false;
  return t.expiry_date < today;
}

export default async function SuperAdminHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q: rawQ, plan: rawPlan, status: rawStatus, archived: rawArchived, op, salon } = await searchParams;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
  const tenants = ((data ?? []) as Tenant[]).filter(Boolean);

  const q = (rawQ ?? "").trim().toLowerCase();
  const byPlan = (rawPlan ?? "").trim();
  const byStatus = (rawStatus ?? "").trim();
  const byArchived = (rawArchived ?? "active").trim();

  const activeTenants = tenants.filter((t) => !t.archived_at);

  const filtered = tenants.filter((t) => {
    const isArchived = Boolean(t.archived_at);
    if (byArchived === "active" && isArchived) return false;
    if (byArchived === "archived" && !isArchived) return false;
    if (byPlan && t.plan !== byPlan) return false;
    if (byStatus && effectiveTenantStatus(t) !== byStatus) return false;
    if (!q) return true;
    return (
      t.salon_name.toLowerCase().includes(q) ||
      t.salon_slug.toLowerCase().includes(q) ||
      (t.owner_email ?? "").toLowerCase().includes(q)
    );
  });

  const today = todayISO();
  const callCards = activeTenants.filter((t) => {
    const base = t.expiry_date ?? null;
    if (!base) return false;
    const day15 = plusDays(base, 15);
    const day25 = plusDays(base, 25);
    return day15 === today || day25 === today;
  });

  const activeCount = activeTenants.filter((t) => t.status === "active").length;
  const overdueCount = activeTenants.filter((t) => isOverdue(t, today)).length;
  const archivedCount = tenants.filter((t) => Boolean(t.archived_at)).length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = activeTenants.filter((t) => {
    if (!t.created_at) return false;
    return new Date(t.created_at) >= weekAgo;
  }).length;
  const mrr = activeTenants
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + readPublicPlanPriceMonthly(t.plan), 0);

  const inSevenDays = plusDays(today, 7);
  const expiringSoon = activeTenants
    .filter((t) => Boolean(t.expiry_date) && t.status === "active" && (t.expiry_date as string) >= today && (t.expiry_date as string) <= inSevenDays)
    .slice(0, 5);
  const inactiveNeedsArchive = tenants.filter((t) => t.status === "inactive" && !t.archived_at).slice(0, 5);
  const oldTrials = activeTenants
    .filter((t) => t.status === "trial" && Boolean(t.created_at) && (t.created_at as string).slice(0, 10) < plusDays(today, -7))
    .slice(0, 5);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: events } = await supabase
    .from("page_events")
    .select("event_type, created_at")
    .in("event_type", ["visitor", "cta_click", "form_filled"])
    .gte("created_at", thirtyDaysAgo.toISOString());
  const eventRows = (events ?? []) as Array<{ event_type: string; created_at: string }>;
  const visitors = eventRows.filter((x) => x.event_type === "visitor").length;
  const ctas = eventRows.filter((x) => x.event_type === "cta_click").length;
  const forms = eventRows.filter((x) => x.event_type === "form_filled").length;

  // Build daily chart data for last 30 days
  const dailyMap = new Map<string, DailyEvent>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dailyMap.set(key, { date: key.slice(5), visitors: 0, cta_click: 0, form_filled: 0 });
  }
  for (const row of eventRows) {
    const key = row.created_at.slice(0, 10);
    const entry = dailyMap.get(key);
    if (!entry) continue;
    if (row.event_type === "visitor") entry.visitors++;
    else if (row.event_type === "cta_click") entry.cta_click++;
    else if (row.event_type === "form_filled") entry.form_filled++;
  }
  const chartData = Array.from(dailyMap.values());

  // Churn risk: last sign-in per owner email
  const { data: authUsersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const lastSignInByEmail = new Map<string, string>();
  for (const u of authUsersData?.users ?? []) {
    if (u.email && u.last_sign_in_at) lastSignInByEmail.set(u.email, u.last_sign_in_at);
  }
  const sevenDaysAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="space-y-10">
      {op === "grace_extended" ? (
        <div className="rounded-xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm font-semibold text-amber-300">
          ✓ Гратисът е удължен с 7 дни за <span className="text-amber-200">{salon ?? "тенанта"}</span>.
        </div>
      ) : null}
      {op === "marked_active" ? (
        <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-sm font-semibold text-emerald-300">
          ✓ Тенантът <span className="text-emerald-200">{salon ?? ""}</span> е активиран.
        </div>
      ) : null}
      {op === "tenant_deleted" ? (
        <div className="rounded-xl border border-red-700/60 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-300">
          ✓ Тенантът <span className="text-red-200">{salon ?? ""}</span> е изтрит окончателно.
        </div>
      ) : null}
      {op === "already_active" ? (
        <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/80 px-4 py-3 text-sm font-semibold text-neutral-300">
          Инфо: Тенантът <span className="text-neutral-100">{salon ?? ""}</span> вече е активен.
        </div>
      ) : null}
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Супер админ табло</h1>
        <p className="mt-2 text-sm text-neutral-400">Оперативен панел за обаждания, тенанти, статистика и CTR фуния.</p>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Обаждания днес (15-и и 25-и ден от grace месец)</h2>
          <span className="text-xs text-neutral-400">{today}</span>
        </div>
        {callCards.length === 0 ? (
          <p className="text-sm text-neutral-400">Няма салони за обаждане днес (по expiry +15/+25).</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {callCards.map((t) => (
              <div key={t.id} className="rounded-xl border border-neutral-700 bg-neutral-950/60 p-4">
                <p className="font-medium">{t.salon_name}</p>
                <p className="mt-1 text-sm text-neutral-300">{t.owner_phone ?? "няма телефон"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-neutral-400">План: {t.plan}</p>
                <p className="mt-1 text-xs text-neutral-500">Expiry: {t.expiry_date ?? "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {(expiringSoon.length > 0 || inactiveNeedsArchive.length > 0 || oldTrials.length > 0) && (
        <section className="rounded-2xl border border-orange-900/70 bg-orange-950/20 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-orange-200">Needs Attention</h2>
          <p className="mt-1 text-sm text-orange-300/80">Салони, които искат действие днес.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {expiringSoon.length > 0 && (
              <div className="rounded-xl border border-orange-800/60 bg-neutral-950/60 p-3">
                <p className="text-xs uppercase tracking-wide text-orange-300">Изтичат до 7 дни</p>
                <div className="mt-2 space-y-2">
                  {expiringSoon.map((t) => (
                    <p key={t.id} className="text-xs text-neutral-200">
                      <span className="font-semibold">{t.salon_name}</span> · {t.expiry_date}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {inactiveNeedsArchive.length > 0 && (
              <div className="rounded-xl border border-orange-800/60 bg-neutral-950/60 p-3">
                <p className="text-xs uppercase tracking-wide text-orange-300">Inactive, но не архивирани</p>
                <div className="mt-2 space-y-2">
                  {inactiveNeedsArchive.map((t) => (
                    <p key={t.id} className="text-xs text-neutral-200">
                      <span className="font-semibold">{t.salon_name}</span> · {t.salon_slug}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {oldTrials.length > 0 && (
              <div className="rounded-xl border border-orange-800/60 bg-neutral-950/60 p-3">
                <p className="text-xs uppercase tracking-wide text-orange-300">Пробни над 7 дни</p>
                <div className="mt-2 space-y-2">
                  {oldTrials.map((t) => (
                    <p key={t.id} className="text-xs text-neutral-200">
                      <span className="font-semibold">{t.salon_name}</span> · {t.created_at?.slice(0, 10)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Активни салони</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-sky-800/60 bg-sky-950/30 p-4">
          <p className="text-xs uppercase tracking-wide text-sky-300">Нови тази седмица</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{newThisWeek}</p>
        </div>
        <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-300">MRR</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{mrr.toFixed(2)} €</p>
        </div>
        <div className="rounded-xl border border-violet-800/60 bg-violet-950/30 p-4">
          <p className="text-xs uppercase tracking-wide text-violet-300">ARPU</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {activeCount > 0 ? (mrr / activeCount).toFixed(2) : "0.00"} €
          </p>
          <p className="mt-1 text-xs text-neutral-500">среден приход / салон</p>
        </div>
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4">
          <p className="text-xs uppercase tracking-wide text-red-300">Просрочени (изтекъл период)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{overdueCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-300">Архивирани салони</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{archivedCount}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">CTR Dashboard</h2>
          <span className="text-xs text-neutral-500">последните 30 дни</span>
        </div>
        <p className="mb-4 text-sm text-neutral-400">Фуния: посетители → CTA click → форма попълнена.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-sky-800/60 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">Посетители</p>
            <p className="text-xl font-semibold tabular-nums text-sky-300">{visitors}</p>
          </div>
          <div className="rounded-lg border border-amber-800/60 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">CTA клик</p>
            <p className="text-xl font-semibold tabular-nums text-amber-300">
              {ctas}{visitors > 0 ? <span className="ml-1 text-sm text-neutral-400">({((ctas / visitors) * 100).toFixed(1)}%)</span> : null}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-800/60 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">Форма попълнена</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-300">
              {forms}{visitors > 0 ? <span className="ml-1 text-sm text-neutral-400">({((forms / visitors) * 100).toFixed(1)}%)</span> : null}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <p className="mb-3 text-xs uppercase tracking-wide text-neutral-500">Посещения по ден</p>
          <VisitsChart data={chartData} />
        </div>
      </section>

      <section id="all-tenants" className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Всички тенанти</h2>
          <Link href="/super-admin/new" className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900">
            + Нов тенант
          </Link>
        </div>
        <form className="mb-4 grid gap-2 sm:grid-cols-5">
          <input name="q" defaultValue={rawQ ?? ""} placeholder="Търси по ime/slug/имейл" className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          <select name="plan" defaultValue={rawPlan ?? ""} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
            <option value="">Всички планове</option>
            <option value="starter">starter</option>
            <option value="standard">standard</option>
            <option value="pro">pro</option>
            <option value="premium">premium</option>
          </select>
          <select name="status" defaultValue={rawStatus ?? ""} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
            <option value="">Всички статуси</option>
            <option value="trial">trial</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <select name="archived" defaultValue={rawArchived ?? "active"} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
            <option value="active">Само активни (неархивирани)</option>
            <option value="archived">Само архивирани</option>
            <option value="all">Всички</option>
          </select>
          <button type="submit" className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium">
            Филтрирай
          </button>
        </form>
        <div className="space-y-3 sm:hidden">
          {filtered.map((t) => {
            const overdue = isOverdue(t, today);
            const status = effectiveTenantStatus(t);
            const canExtendGrace = status !== "archived";
            const canMarkActive = status !== "active";
            return (
              <div
                key={t.id}
                className={overdue ? "rounded-xl border border-red-900/70 bg-red-950/20 p-3" : "rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3"}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.salon_name}</p>
                    <p className="mt-1 text-xs text-neutral-400">{t.salon_slug}</p>
                  </div>
                  <Link href={`/super-admin/${t.salon_slug}`} className="text-sm text-sky-300 hover:text-sky-200">
                    Отвори
                  </Link>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-300">
                  <p>План: <span className="font-semibold text-amber-200">{t.plan}</span></p>
                  <p><StatusBadge status={effectiveTenantStatus(t)} /></p>
                  {t.archived_at ? <p className="col-span-2 text-[11px] text-neutral-500">Архивиран: {t.archived_at.slice(0, 10)}</p> : null}
                  <p className="col-span-2">Собственик: {t.owner_email ?? "—"}</p>
                  <p className="col-span-2">
                    {t.created_at?.slice(0, 10) ?? "—"} · {overdue ? `Просрочен (${t.expiry_date})` : t.expiry_date ? `До ${t.expiry_date}` : "без срок"}
                  </p>
                </div>
                <form action={enterSalonAdminContextAction} className="mt-3">
                  <input type="hidden" name="salon_slug" value={t.salon_slug} />
                  <button type="submit" className="w-full rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                    Салонски админ
                  </button>
                </form>
                <form action={t.archived_at ? restoreTenantAction : archiveTenantAction} className="mt-2">
                  <input type="hidden" name="salon_slug" value={t.salon_slug} />
                  <ArchiveTenantSubmitButton
                    actionKind={t.archived_at ? "restore" : "archive"}
                    salonName={t.salon_name}
                    className={
                      t.archived_at
                        ? "w-full rounded-lg border border-sky-700 bg-sky-950/60 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-900/60"
                        : "w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
                    }
                  />
                </form>
                <form method="get" action={`/super-admin/${t.salon_slug}`} className="mt-2 flex gap-2">
                  <select name="payment_plan" defaultValue={t.plan} className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-2 text-xs text-neutral-200">
                    {MARKETING_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-lg border border-emerald-700 bg-emerald-950/50 px-2 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60">
                    Stripe линк
                  </button>
                </form>
                {t.archived_at ? (
                  <form action={deleteTenantAction} className="mt-2">
                    <input type="hidden" name="salon_slug" value={t.salon_slug} />
                    <DeleteTenantSubmitButton
                      salonName={t.salon_name}
                      salonSlug={t.salon_slug}
                      className="w-full rounded-lg border border-red-700 bg-red-950/40 py-2 text-sm font-semibold text-red-300 hover:bg-red-900/60"
                    />
                  </form>
                ) : null}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {canExtendGrace ? (
                    <form action={extendTenantGraceBy7DaysAction}>
                      <input type="hidden" name="salon_slug" value={t.salon_slug} />
                      <button type="submit" className="w-full rounded-lg border border-amber-700 bg-amber-950/40 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/60">
                        +7 дни grace
                      </button>
                    </form>
                  ) : (
                    <div className="w-full rounded-lg border border-neutral-700 bg-neutral-900/60 py-2 text-center text-xs text-neutral-500">—</div>
                  )}
                  {canMarkActive ? (
                    <form action={markTenantActiveAction}>
                      <input type="hidden" name="salon_slug" value={t.salon_slug} />
                      <button type="submit" className="w-full rounded-lg border border-emerald-700 bg-emerald-950/40 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60">
                        Активирай
                      </button>
                    </form>
                  ) : (
                    <div className="w-full rounded-lg border border-emerald-800/60 bg-emerald-950/20 py-2 text-center text-xs font-semibold text-emerald-300">Активен</div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? <div className="rounded-xl border border-neutral-800/80 px-3 py-6 text-center text-sm text-neutral-400">Няма резултати.</div> : null}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-400">
              <tr className="border-b border-neutral-800">
                <th className="py-2 pr-2">Салон</th>
                <th className="py-2 pr-2">Slug</th>
                <th className="py-2 pr-2">План</th>
                <th className="py-2 pr-2">Статус</th>
                <th className="py-2 pr-2">Собственик</th>
                <th className="py-2 pr-2">Създаден</th>
                <th className="py-2 pr-2">Последен вход</th>
                <th className="py-2 pr-2">Детайли</th>
                <th className="py-2 pr-2">Архив</th>
                <th className="py-2 pr-2">Изтрий</th>
                <th className="py-2 pr-2">Плащане</th>
                <th className="py-2 pr-2">Quick actions</th>
                <th className="py-2">Админ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const overdue = isOverdue(t, today);
                const status = effectiveTenantStatus(t);
                const canExtendGrace = status !== "archived";
                const canMarkActive = status !== "active";
                return (
                <tr key={t.id} className={overdue ? "border-b border-red-900/70 bg-red-950/20" : "border-b border-neutral-800/80"}>
                  <td className="py-2 pr-2 font-medium">{t.salon_name}</td>
                  <td className="py-2 pr-2 text-neutral-300">{t.salon_slug}</td>
                  <td className="py-2 pr-2 font-semibold text-amber-200">{t.plan}</td>
                  <td className="py-2 pr-2"><StatusBadge status={effectiveTenantStatus(t)} /></td>
                  <td className="py-2 pr-2 text-neutral-300">{t.owner_email ?? "—"}</td>
                  <td className="py-2 pr-2 text-neutral-300">
                    {t.created_at?.slice(0, 10) ?? "—"}
                    {t.archived_at ? (
                      <span className="ml-2 rounded bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300">
                        Архивиран
                      </span>
                    ) : null}
                    <span className={overdue ? "ml-2 rounded bg-red-900/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-100" : "ml-2 text-[10px] text-neutral-500"}>
                      {overdue ? `Просрочен (${t.expiry_date})` : t.expiry_date ? `До ${t.expiry_date}` : "без срок"}
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    {(() => {
                      const lastSignIn = t.owner_email ? lastSignInByEmail.get(t.owner_email) : undefined;
                      if (!lastSignIn) return <span className="text-xs text-neutral-500">—</span>;
                      const isRisky = lastSignIn < sevenDaysAgoISO;
                      return (
                        <span className={isRisky ? "text-xs font-semibold text-red-400" : "text-xs text-neutral-400"}>
                          {isRisky ? "⚠ " : ""}{lastSignIn.slice(0, 10)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-2 pr-2">
                    <Link href={`/super-admin/${t.salon_slug}`} className="text-sky-300 hover:text-sky-200">
                      Отвори
                    </Link>
                  </td>
                  <td className="py-2 pr-2">
                    <form action={t.archived_at ? restoreTenantAction : archiveTenantAction}>
                      <input type="hidden" name="salon_slug" value={t.salon_slug} />
                      <ArchiveTenantSubmitButton
                        actionKind={t.archived_at ? "restore" : "archive"}
                        salonName={t.salon_name}
                        className={t.archived_at ? "text-xs font-semibold text-sky-300 hover:text-sky-200" : "text-xs font-semibold text-neutral-300 hover:text-neutral-200"}
                      />
                    </form>
                  </td>
                  <td className="py-2 pr-2">
                    {t.archived_at ? (
                      <form action={deleteTenantAction}>
                        <input type="hidden" name="salon_slug" value={t.salon_slug} />
                        <DeleteTenantSubmitButton
                          salonName={t.salon_name}
                          salonSlug={t.salon_slug}
                          className="text-xs font-semibold text-red-400 hover:text-red-300"
                        />
                      </form>
                    ) : (
                      <span className="text-xs text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <form method="get" action={`/super-admin/${t.salon_slug}`} className="flex items-center gap-2">
                      <select name="payment_plan" defaultValue={t.plan} className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200">
                        {MARKETING_PLANS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">
                        Stripe линк
                      </button>
                    </form>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      {canExtendGrace ? (
                        <form action={extendTenantGraceBy7DaysAction}>
                          <input type="hidden" name="salon_slug" value={t.salon_slug} />
                          <button type="submit" className="text-xs font-semibold text-amber-300 hover:text-amber-200">
                            +7 grace
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-neutral-600">—</span>
                      )}
                      <span className="text-neutral-600">·</span>
                      {canMarkActive ? (
                        <form action={markTenantActiveAction}>
                          <input type="hidden" name="salon_slug" value={t.salon_slug} />
                          <button type="submit" className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">
                            Активирай
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-300">Активен</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2">
                    <form action={enterSalonAdminContextAction}>
                      <input type="hidden" name="salon_slug" value={t.salon_slug} />
                      <button type="submit" className="text-left text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                        Салонски админ
                      </button>
                    </form>
                  </td>
                </tr>
              )})}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-neutral-400">
                    Няма резултати.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
