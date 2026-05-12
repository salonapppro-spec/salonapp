import Link from "next/link";

import { closeCallTaskAction, markCallTaskCalledAction, snoozeCallTaskAction } from "./actions";

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

type LeadCallTask = {
  id: string;
  lead_id: string;
  call_day: 15 | 25;
  due_date: string;
  status: "pending" | "called" | "no_answer" | "closed";
  last_called_at: string | null;
  next_call_at: string | null;
  note: string | null;
  created_at: string;
};

const PLAN_BADGE: Record<string, { cls: string }> = {
  starter: { cls: "bg-neutral-800 text-neutral-300 border border-neutral-600" },
  standard:      { cls: "bg-sky-900/60 text-sky-300 border border-sky-700/60" },
  pro:  { cls: "bg-amber-900/60 text-amber-300 border border-amber-700/60" },
  premium: { cls: "bg-violet-900/60 text-violet-300 border border-violet-700/60" },
};

const TASK_STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-900/50 text-amber-300 border border-amber-700/60",
  called: "bg-emerald-900/50 text-emerald-300 border border-emerald-700/60",
  no_answer: "bg-sky-900/50 text-sky-300 border border-sky-700/60",
  closed: "bg-neutral-800 text-neutral-300 border border-neutral-600",
};

function isSystemLeadEmail(value: string | null | undefined): boolean {
  return Boolean(value && value.toLowerCase().endsWith("@no-email.salonapp.pro"));
}

function plusDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

async function ensureAutoCallTasks(supabase: ReturnType<typeof createSupabaseServiceRoleClient>, leads: Lead[]) {
  const rows = leads.flatMap((lead) => {
    const base = lead.created_at.slice(0, 10);
    return [
      { lead_id: lead.id, call_day: 15, due_date: plusDays(base, 15) },
      { lead_id: lead.id, call_day: 25, due_date: plusDays(base, 25) },
    ];
  });
  if (rows.length === 0) return;

  await supabase.from("lead_call_tasks").upsert(rows, { onConflict: "lead_id,call_day", ignoreDuplicates: true });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("bg-BG", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function norm(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

export default async function SuperAdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ op?: string; view?: string }>;
}) {
  const { op, view } = await searchParams;
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("platform_leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];
  const { data: tenantsData } = await supabase
    .from("tenants")
    .select("salon_slug,salon_name,owner_email,owner_phone")
    .is("archived_at", null);
  const tenants = (tenantsData ?? []) as Array<{
    salon_slug: string;
    salon_name: string;
    owner_email: string | null;
    owner_phone: string | null;
  }>;
  await ensureAutoCallTasks(supabase, leads);
  const today = new Date().toISOString().slice(0, 10);

  const { data: callTaskData } = await supabase
    .from("lead_call_tasks")
    .select("*")
    .order("lead_id", { ascending: true })
    .order("call_day", { ascending: true })
    .order("created_at", { ascending: false });
  const callTasks = (callTaskData ?? []) as LeadCallTask[];
  const tasksByLead = new Map<string, LeadCallTask[]>();
  for (const task of callTasks) {
    const list = tasksByLead.get(task.lead_id) ?? [];
    list.push(task);
    tasksByLead.set(task.lead_id, list);
  }

  const dueToday = callTasks.filter((t) => t.status !== "closed" && (t.next_call_at ?? t.due_date) <= today).length;
  const overdue = callTasks.filter((t) => t.status !== "closed" && (t.next_call_at ?? t.due_date) < today).length;
  const day15 = callTasks.filter((t) => t.call_day === 15 && t.status !== "closed").length;
  const day25 = callTasks.filter((t) => t.call_day === 25 && t.status !== "closed").length;

  return (
    <div className="space-y-6">
      {op === "called" ? (
        <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-sm font-semibold text-emerald-300">✓ Отбелязано като обадено.</div>
      ) : null}
      {op === "snoozed" ? (
        <div className="rounded-xl border border-sky-700/60 bg-sky-950/40 px-4 py-3 text-sm font-semibold text-sky-300">✓ Задачата е отложена с +2 дни.</div>
      ) : null}
      {op === "closed" ? (
        <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/80 px-4 py-3 text-sm font-semibold text-neutral-300">✓ Задачата е затворена.</div>
      ) : null}
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

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5">
        <h2 className="text-lg font-semibold">Call статус</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-300">За обаждане днес</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{dueToday}</p>
          </div>
          <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-3">
            <p className="text-xs uppercase tracking-wide text-red-300">Просрочени</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{overdue}</p>
          </div>
          <div className="rounded-xl border border-sky-800/60 bg-sky-950/30 p-3">
            <p className="text-xs uppercase tracking-wide text-sky-300">15-ти ден</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{day15}</p>
          </div>
          <div className="rounded-xl border border-violet-800/60 bg-violet-950/30 p-3">
            <p className="text-xs uppercase tracking-wide text-violet-300">25-ти ден</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{day25}</p>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["starter", "standard", "pro", "premium"] as const).map((plan) => {
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
            const existingTenant = tenants.find((t) => {
              const byEmail = norm(lead.email) && norm(lead.email) === norm(t.owner_email);
              const byPhone = norm(lead.phone) && norm(lead.phone) === norm(t.owner_phone);
              const byName = norm(lead.salon_name) && norm(lead.salon_name) === norm(t.salon_name);
              return Boolean(byEmail || byPhone || byName);
            });
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
                  {lead.email && !isSystemLeadEmail(lead.email) ? (
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
                  {existingTenant ? (
                    <Link
                      href={`/super-admin/${existingTenant.salon_slug}`}
                      className="rounded-lg border border-violet-700/60 bg-violet-950/30 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-900/40"
                    >
                      👁️ Отвори тенант
                    </Link>
                  ) : (
                    <Link
                      href={`/super-admin/new?name=${encodeURIComponent(lead.salon_name)}&email=${encodeURIComponent(isSystemLeadEmail(lead.email) ? "" : (lead.email ?? ""))}&phone=${encodeURIComponent(lead.phone ?? "")}&plan=${encodeURIComponent(lead.plan)}`}
                      className="rounded-lg border border-amber-700/60 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/40"
                    >
                      ➕ Създай тенант
                    </Link>
                  )}
                </div>

                <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Обаждания (15-ти / 25-ти ден)</p>
                  <div className="mt-2 space-y-2">
                    {(tasksByLead.get(lead.id) ?? []).map((task) => {
                      const due = task.next_call_at ?? task.due_date;
                      return (
                        <div key={task.id} className="grid gap-2 rounded-lg border border-neutral-800/80 bg-neutral-950/70 p-2 sm:grid-cols-[120px_110px_1fr_auto] sm:items-center">
                          <div className="text-xs text-neutral-300">{task.call_day}-ти ден</div>
                          <div className="text-xs text-neutral-400">{due}</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TASK_STATUS_BADGE[task.status] ?? TASK_STATUS_BADGE.pending}`}>{task.status}</span>
                            <span className="text-xs text-neutral-500">{task.note ?? "—"}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <form action={markCallTaskCalledAction} className="flex items-center gap-1">
                              <input type="hidden" name="task_id" value={task.id} />
                              <input name="note" placeholder="бележка" className="w-24 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px]" />
                              <input name="next_call_at" type="date" className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px]" />
                              <button type="submit" className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200">Обадих се</button>
                            </form>
                            <form action={snoozeCallTaskAction}>
                              <input type="hidden" name="task_id" value={task.id} />
                              <button type="submit" className="text-[11px] font-semibold text-sky-300 hover:text-sky-200">+2 дни</button>
                            </form>
                            <form action={closeCallTaskAction}>
                              <input type="hidden" name="task_id" value={task.id} />
                              <button type="submit" className="text-[11px] font-semibold text-neutral-300 hover:text-neutral-100">Затвори</button>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
