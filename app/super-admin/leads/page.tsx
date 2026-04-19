import Link from "next/link";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

type Lead = {
  id: string;
  plan: string;
  salon_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  created_at: string;
};

const PLAN_BADGE: Record<string, { cls: string }> = {
  standard: { cls: "bg-neutral-800 text-neutral-300 border border-neutral-600" },
  pro:      { cls: "bg-sky-900/60 text-sky-300 border border-sky-700/60" },
  premium:  { cls: "bg-amber-900/60 text-amber-300 border border-amber-700/60" },
  collective: { cls: "bg-violet-900/60 text-violet-300 border border-violet-700/60" },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("bg-BG", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function SuperAdminLeadsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("platform_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Заявки от сайта</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Входяща кутия — {leads.length} заявки общо.{" "}
            {error ? <span className="text-red-400">Грешка при зареждане: {error.message}</span> : null}
          </p>
        </div>
        <Link href="/super-admin" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
          ← Обратно
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["standard", "pro", "premium", "collective"] as const).map((plan) => {
          const count = leads.filter((l) => l.plan === plan).length;
          const pb = PLAN_BADGE[plan];
          return (
            <div key={plan} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">{plan}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pb.cls}`}>{count}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Lead list */}
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 text-center">
          <p className="text-neutral-400">Все още няма заявки. Те ще се появят тук след попълване на формата на маркетинг сайта.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const pb = PLAN_BADGE[lead.plan] ?? PLAN_BADGE.standard;
            return (
              <div key={lead.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: main info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pb.cls}`}>
                        {lead.plan}
                      </span>
                      <h2 className="truncate text-base font-semibold text-white">{lead.salon_name}</h2>
                    </div>
                    <p className="mt-1 text-sm text-neutral-300">
                      <span className="font-medium text-white">{lead.contact_name}</span>
                      {lead.email ? (
                        <>
                          {" · "}
                          <a href={`mailto:${lead.email}`} className="text-sky-400 hover:text-sky-300">
                            {lead.email}
                          </a>
                        </>
                      ) : null}
                      {lead.phone ? (
                        <>
                          {" · "}
                          <a href={`tel:${lead.phone}`} className="text-emerald-400 hover:text-emerald-300">
                            {lead.phone}
                          </a>
                        </>
                      ) : (
                        <span className="text-neutral-500"> · без телефон</span>
                      )}
                    </p>
                    {lead.message ? (
                      <p className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm text-neutral-300 italic">
                        {lead.message}
                      </p>
                    ) : null}
                  </div>

                  {/* Right: meta */}
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-neutral-500">
                    <span>{fmtDate(lead.created_at)}</span>
                    <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-400">{lead.source}</span>
                  </div>
                </div>

                {/* Action row */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-800 pt-3">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}?subject=Покана за SalonApp.pro&body=Здравейте ${lead.contact_name},%0A%0AБлагодаря за интереса към SalonApp.pro.`}
                      className="rounded-lg border border-sky-700/60 bg-sky-950/30 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-900/40"
                    >
                      ✉️ Изпрати имейл
                    </a>
                  ) : null}
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="rounded-lg border border-emerald-700/60 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40"
                    >
                      📞 Обади се
                    </a>
                  ) : null}
                  <Link
                    href={`/super-admin/new?name=${encodeURIComponent(lead.salon_name)}&email=${encodeURIComponent(lead.email ?? "")}&phone=${encodeURIComponent(lead.phone ?? "")}&plan=${encodeURIComponent(lead.plan)}`}
                    className="rounded-lg border border-amber-700/60 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/40"
                  >
                    ➕ Създай тенант
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
