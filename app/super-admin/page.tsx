import Link from "next/link";

import { enterSalonAdminContextAction } from "@/app/super-admin/actions";
import { readPublicPlanPriceMonthly } from "@/lib/marketing-pricing-env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import type { Tenant } from "@/types";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:   { label: "Активен",   cls: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60" },
  trial:    { label: "Пробен",    cls: "bg-amber-900/60 text-amber-300 border border-amber-700/60" },
  inactive: { label: "Неактивен", cls: "bg-red-900/60 text-red-300 border border-red-700/60" },
};

type SearchParams = { q?: string; plan?: string; status?: string };

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

function isOverdue(t: Tenant, today: string): boolean {
  if (!t.expiry_date) return false;
  return t.expiry_date < today;
}

export default async function SuperAdminHomePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
  const tenants = ((data ?? []) as Tenant[]).filter(Boolean);

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const byPlan = (searchParams.plan ?? "").trim();
  const byStatus = (searchParams.status ?? "").trim();

  const filtered = tenants.filter((t) => {
    if (byPlan && t.plan !== byPlan) return false;
    if (byStatus && t.status !== byStatus) return false;
    if (!q) return true;
    return (
      t.salon_name.toLowerCase().includes(q) ||
      t.salon_slug.toLowerCase().includes(q) ||
      (t.owner_email ?? "").toLowerCase().includes(q)
    );
  });

  const today = todayISO();
  const callCards = tenants.filter((t) => {
    const base = t.expiry_date ?? null;
    if (!base) return false;
    const day15 = plusDays(base, 15);
    const day25 = plusDays(base, 25);
    return day15 === today || day25 === today;
  });

  const activeCount = tenants.filter((t) => t.status === "active").length;
  const overdueCount = tenants.filter((t) => isOverdue(t, today)).length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = tenants.filter((t) => {
    if (!t.created_at) return false;
    return new Date(t.created_at) >= weekAgo;
  }).length;
  const mrr = tenants
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + readPublicPlanPriceMonthly(t.plan), 0);

  const { data: events } = await supabase
    .from("page_events")
    .select("event_type")
    .in("event_type", ["visitor", "cta_click", "form_filled"]);
  const eventRows = (events ?? []) as Array<{ event_type: string }>;
  const visitors = eventRows.filter((x) => x.event_type === "visitor").length;
  const ctas = eventRows.filter((x) => x.event_type === "cta_click").length;
  const forms = eventRows.filter((x) => x.event_type === "form_filled").length;

  return (
    <div className="space-y-10">
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
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 sm:col-span-3">
          <p className="text-xs uppercase tracking-wide text-red-300">Просрочени (изтекъл период)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{overdueCount}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
        <h2 className="text-lg font-semibold">CTR Dashboard</h2>
        <p className="mt-1 text-sm text-neutral-400">Фуния: посетители → CTA click → форма попълнена.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-700 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">Посетители</p>
            <p className="text-xl font-semibold tabular-nums">{visitors}</p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">CTA click</p>
            <p className="text-xl font-semibold tabular-nums">
              {ctas} {visitors > 0 ? <span className="text-sm text-neutral-400">({((ctas / visitors) * 100).toFixed(1)}%)</span> : null}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-950/60 p-3">
            <p className="text-xs text-neutral-400">Форма попълнена</p>
            <p className="text-xl font-semibold tabular-nums">
              {forms} {ctas > 0 ? <span className="text-sm text-neutral-400">({((forms / ctas) * 100).toFixed(1)}%)</span> : null}
            </p>
          </div>
        </div>
      </section>

      <section id="all-tenants" className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Всички тенанти</h2>
          <Link href="/super-admin/new" className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900">
            + Нов тенант
          </Link>
        </div>
        <form className="mb-4 grid gap-2 sm:grid-cols-4">
          <input name="q" defaultValue={q} placeholder="Търси по име/slug/имейл" className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          <select name="plan" defaultValue={byPlan} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
            <option value="">Всички планове</option>
            <option value="standard">standard</option>
            <option value="pro">pro</option>
            <option value="premium">premium</option>
            <option value="collective">collective</option>
          </select>
          <select name="status" defaultValue={byStatus} className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
            <option value="">Всички статуси</option>
            <option value="trial">trial</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button type="submit" className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium">
            Филтрирай
          </button>
        </form>
        <div className="space-y-3 sm:hidden">
          {filtered.map((t) => {
            const overdue = isOverdue(t, today);
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
                  <p><StatusBadge status={t.status} /></p>
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
                <th className="py-2 pr-2">Детайли</th>
                <th className="py-2">Админ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const overdue = isOverdue(t, today);
                return (
                <tr key={t.id} className={overdue ? "border-b border-red-900/70 bg-red-950/20" : "border-b border-neutral-800/80"}>
                  <td className="py-2 pr-2 font-medium">{t.salon_name}</td>
                  <td className="py-2 pr-2 text-neutral-300">{t.salon_slug}</td>
                  <td className="py-2 pr-2 font-semibold text-amber-200">{t.plan}</td>
                  <td className="py-2 pr-2"><StatusBadge status={t.status} /></td>
                  <td className="py-2 pr-2 text-neutral-300">{t.owner_email ?? "—"}</td>
                  <td className="py-2 pr-2 text-neutral-300">
                    {t.created_at?.slice(0, 10) ?? "—"}
                    <span className={overdue ? "ml-2 rounded bg-red-900/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-100" : "ml-2 text-[10px] text-neutral-500"}>
                      {overdue ? `Просрочен (${t.expiry_date})` : t.expiry_date ? `До ${t.expiry_date}` : "без срок"}
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    <Link href={`/super-admin/${t.salon_slug}`} className="text-sky-300 hover:text-sky-200">
                      Отвори
                    </Link>
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
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
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
