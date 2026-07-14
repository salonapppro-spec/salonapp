"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Monitor } from "lucide-react";

import {
  type CategorySlice,
  type MonthBar,
  type Transaction,
  EXPENSE_CATEGORIES,
} from "@/lib/finance-constants";

export type { CategorySlice, MonthBar, Transaction };
export { EXPENSE_CATEGORIES };

// ─── Constants ────────────────────────────────────────────────────────────────
const BG_MONTHS = [
  "Януари","Февруари","Март","Април","Май","Юни",
  "Юли","Август","Септември","Октомври","Ноември","Декември",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_SHORT = ["яну","фев","мар","апр","май","юни","юли","авг","сеп","окт","ное","дек"];

function fmtDateBg(d: string): string {
  const parts = d.split("-");
  return `${Number(parts[2])} ${MONTH_SHORT[Number(parts[1]) - 1]}`;
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices, total }: { slices: CategorySlice[]; total: number }) {
  const r = 46, cx = 62, cy = 62, size = 124, strokeW = 16;
  const circumference = 2 * Math.PI * r;
  const active = slices.filter((s) => s.amount > 0);

  if (total === 0 || active.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#94a3b8">
          Няма
        </text>
      </svg>
    );
  }

  let accumulated = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
      {active.map((slice) => {
        const dashLen    = (slice.amount / total) * circumference;
        const dashOffset = circumference * 0.25 - accumulated;
        accumulated += dashLen;
        return (
          <circle
            key={slice.category}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={dashOffset}
          />
        );
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={15} fontWeight="700" fill="#1A1A1A">
        {total.toFixed(0)}€
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill="#94a3b8">
        разходи
      </text>
    </svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data }: { data: MonthBar[] }) {
  const maxVal  = Math.max(1, ...data.flatMap((d) => [d.revenue, d.expenses]));
  const BAR_H   = 72;
  const BAR_W   = 10;
  const GAP     = 4;
  const GROUP_W = BAR_W * 2 + GAP + 14;
  const W       = data.length * GROUP_W;

  return (
    <svg width="100%" height={BAR_H + 22} viewBox={`0 0 ${W} ${BAR_H + 22}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const revH = Math.max(2, (d.revenue  / maxVal) * BAR_H);
        const expH = Math.max(2, (d.expenses / maxVal) * BAR_H);
        const x    = i * GROUP_W + 7;
        return (
          <g key={d.label}>
            <rect x={x}           y={BAR_H - revH} width={BAR_W} height={revH} rx={3} fill="#10b981" />
            <rect x={x + BAR_W + GAP} y={BAR_H - expH} width={BAR_W} height={expH} rx={3} fill="#f43f5e" />
            <text x={x + BAR_W + 2} y={BAR_H + 14} textAnchor="middle" fontSize={7.5} fill="#94a3b8">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [amount,   setAmount]   = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].value);
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  async function save() {
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) { setErr("Въведете положителна сума"); return; }
    setSaving(true);
    setErr(null);
    try {
      const res  = await fetch("/api/admin/expenses", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ date, amount: n, description: category }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Грешка");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-t-[2rem] bg-white p-6 pb-10 shadow-2xl sm:rounded-[2rem] sm:pb-6">
        {/* drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

        <h2 className="text-xl font-black text-[#1A1A1A]">Добави разход</h2>

        {err ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
        ) : null}

        <div className="mt-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Сума (€)</label>
            <input
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-4xl font-black tabular-nums text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]/60 focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/20"
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Категория</label>
            <select
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]/60 focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/20"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.value}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Дата</label>
            <input
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base tabular-nums text-[#1A1A1A] outline-none transition focus:border-[#C9A84C]/60 focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/20"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <button
          className="mt-7 w-full rounded-2xl bg-[#1A1A1A] py-4 text-base font-black text-white shadow-lg transition hover:bg-[#2A2A2A] active:scale-95 disabled:opacity-40"
          onClick={() => void save()}
          disabled={saving}
        >
          {saving ? "Запазване…" : "Запази"}
        </button>
        <button
          className="mt-3 w-full py-2 text-sm text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          Отказ
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function FinancesDashboard(props: {
  salonName:        string;
  year:             number;
  month:            number;
  revenue:          number;
  overhead:         number;
  variableExpenses: number;
  categorySlices:   CategorySlice[];
  last6Months:      MonthBar[];
  transactions:     Transaction[];
  overheadMissing:  boolean;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const totalExpenses = props.overhead + props.variableExpenses;
  const netProfit     = props.revenue - totalExpenses;

  const now            = new Date();
  const isCurrentMonth = props.year === now.getFullYear() && props.month === now.getMonth() + 1;

  function goMonth(delta: number) {
    let m = props.month + delta;
    let y = props.year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    router.push(`/admin/finances?y=${y}&m=${m}`);
  }

  return (
    <div className="relative pb-32">

      {/* ── Header ───────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white" style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}>
              Бизнес калкулатор
            </span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
            {BG_MONTHS[props.month - 1]} {props.year}
          </p>
          <p className="mt-0.5 text-sm text-[#1A1A1A]/45">{props.salonName}</p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-0.5 rounded-2xl border border-[#C9A84C]/25 bg-white p-1 shadow-sm">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl text-lg text-[#1A1A1A]/50 transition hover:bg-[#C9A84C]/08 active:scale-90"
            onClick={() => goMonth(-1)}
          >‹</button>
          <span className="min-w-[80px] text-center text-sm font-bold text-[#1A1A1A]">
            {BG_MONTHS[props.month - 1].slice(0, 3)}
          </span>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl text-lg text-[#1A1A1A]/50 transition hover:bg-[#C9A84C]/08 active:scale-90 disabled:opacity-25"
            onClick={() => goMonth(1)}
            disabled={isCurrentMonth}
          >›</button>
        </div>
      </div>

      {/* ── Big 3 ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* Revenue */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Прогнозна стойност</span>
            <span className="rounded-lg bg-[#C9A84C]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B6914]">завършени</span>
          </div>
          <p className="mt-3 text-[2rem] font-black leading-none tabular-nums" style={{ color: props.revenue > 0 ? "#8B6914" : "rgba(26,26,26,0.22)" }}>
            {props.revenue.toFixed(2)}<span className="ml-1 text-base font-bold opacity-60">€</span>
          </p>
          <p className="mt-1.5 text-[11px] text-[#1A1A1A]/35">от резервации за месеца</p>
        </div>

        {/* Expenses */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(200,130,106,0.2)" }}>
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #C8826A, #C9A84C)" }} />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Разходи</span>
            {props.overhead > 0 && (
              <span className="rounded-lg bg-[#C8826A]/10 px-2 py-0.5 text-[10px] font-bold text-[#9B5B42]">
                {props.overhead.toFixed(0)}€ пост.
              </span>
            )}
          </div>
          <p className="mt-3 text-[2rem] font-black leading-none tabular-nums" style={{ color: totalExpenses > 0 ? "#9B5B42" : "rgba(26,26,26,0.22)" }}>
            {totalExpenses.toFixed(2)}<span className="ml-1 text-base font-bold opacity-60">€</span>
          </p>
          <p className="mt-1.5 text-[11px] text-[#1A1A1A]/35">
            {props.variableExpenses > 0 ? `${props.variableExpenses.toFixed(0)}€ разходи` : "няма въведени разходи"}
          </p>
        </div>

        {/* Net profit */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5" style={{
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
          border: netProfit >= 0 ? "1px solid rgba(201,168,76,0.25)" : "1px solid rgba(200,130,106,0.3)",
        }}>
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl" style={{
            background: netProfit >= 0 ? "linear-gradient(90deg, #C9A84C, #8B6914)" : "linear-gradient(90deg, #C8826A, #9B5B42)",
          }} />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Ориентировъчен резултат</span>
          </div>
          <p className="mt-3 text-[2rem] font-black leading-none tabular-nums" style={{ color: netProfit >= 0 ? "#8B6914" : "#9B5B42" }}>
            {netProfit < 0 ? "−" : ""}
            {Math.abs(netProfit).toFixed(2)}<span className="ml-1 text-base font-bold opacity-60">€</span>
          </p>
          <p className="mt-1.5 text-[11px] text-[#1A1A1A]/35">
            {netProfit >= 0 ? "прогнозна стойност − разходи" : "разходите надвишават прогнозната стойност"}
          </p>
        </div>
      </div>

      {/* Overhead warning */}
      {props.overheadMissing ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠ Постоянните разходи не са зададени — „Ориентировъчен резултат" е непълен.{" "}
          <Link href="/admin/finances/overhead" className="font-semibold underline underline-offset-2">
            Задай ги в Настройки →
          </Link>
        </div>
      ) : null}

      {/* ── Analysis ─────────────────────────────── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">

        {/* Donut */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="mb-4 text-sm font-bold text-[#1A1A1A]">Разходи по категория</p>
          <div className="flex items-center gap-5">
            <DonutChart slices={props.categorySlices} total={props.variableExpenses} />
            <div className="min-w-0 flex-1 space-y-2.5">
              {props.categorySlices.filter((s) => s.amount > 0).map((s) => (
                <div key={s.category} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="truncate text-xs text-slate-600">{s.category}</span>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold tabular-nums text-slate-700">
                    {s.amount.toFixed(0)}€
                  </span>
                </div>
              ))}
              {props.categorySlices.every((s) => s.amount === 0) ? (
                <p className="text-xs text-slate-400">Няма въведени разходи</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="mb-3 text-sm font-bold text-[#1A1A1A]">Последни 6 месеца</p>
          <div className="mb-4 flex gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Прогнозна стойност
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Разходи
            </span>
          </div>
          <BarChart data={props.last6Months} />
        </div>
      </div>

      {/* ── Transactions ─────────────────────────── */}
      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="mb-4 text-sm font-bold text-[#1A1A1A]">Последни движения</p>
        {props.transactions.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A84C]/10">
              <Monitor size={22} strokeWidth={1.7} color="#C9A84C" />
            </div>
            <p className="text-sm text-slate-400">Няма движения за избрания месец</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {props.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                    {t.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{t.label}</p>
                    <p className="text-xs text-slate-400">{fmtDateBg(t.date)}</p>
                  </div>
                </div>
                <span className={[
                  "flex-shrink-0 text-base font-black tabular-nums",
                  t.type === "in" ? "text-emerald-600" : "text-rose-600",
                ].join(" ")}>
                  {t.type === "in" ? "+" : "−"}{t.amount.toFixed(2)} €
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Fixed costs hint ─────────────────────── */}
      <p className="mt-4 text-center text-xs text-slate-400">
        Постоянните разходи може да въведеш или промениш от{" "}
        <Link href="/admin/finances/overhead" className="underline underline-offset-2 hover:text-slate-600">
          тук
        </Link>
      </p>

      {/* ── FAB ──────────────────────────────────── */}
      {/* Скрит докато модалът е отворен — иначе стои върху него (audit: дублиран бутон) */}
      {!showModal ? (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[60] flex justify-center px-4 md:bottom-6">
          <button
            className="flex items-center gap-2.5 rounded-full bg-[#1A1A1A] px-8 py-4 text-base font-black text-white shadow-2xl transition hover:bg-[#2A2A2A] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] active:scale-95"
            onClick={() => setShowModal(true)}
          >
            <span className="text-xl font-light leading-none">+</span>
            Добави разход
          </button>
        </div>
      ) : null}

      {/* Modal */}
      {showModal ? (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh(); }}
        />
      ) : null}
    </div>
  );
}
