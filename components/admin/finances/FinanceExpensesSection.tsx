"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ExpenseRow = { id: string; date: string; amount: number; description: string; supplier: string | null };

function sumAmounts(rows: ExpenseRow[]): number {
  return rows.reduce((s, e) => s + Number(e.amount), 0);
}

export function FinanceExpensesSection(props: { defaultFrom: string; defaultTo: string }) {
  const router = useRouter();
  const [from, setFrom] = useState(props.defaultFrom);
  const [to, setTo] = useState(props.defaultTo);
  const [list, setList] = useState<ExpenseRow[]>([]);
  const [monthRows, setMonthRows] = useState<ExpenseRow[]>([]);
  const [yearRows, setYearRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [date, setDate] = useState(props.defaultTo);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [saving, setSaving] = useState(false);

  const periodSum = useMemo(() => sumAmounts(list), [list]);
  const monthSum = useMemo(() => sumAmounts(monthRows), [monthRows]);
  const yearSum = useMemo(() => sumAmounts(yearRows), [yearRows]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [y, m] = [Number(to.slice(0, 4)), Number(to.slice(5, 7))];
      const daysInMonth = new Date(y, m, 0).getDate();
      const monthFrom = `${y}-${String(m).padStart(2, "0")}-01`;
      const monthTo = `${y}-${String(m).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      const yearFrom = `${y}-01-01`;
      const yearTo = `${y}-12-31`;

      const [resList, resMonth, resYear] = await Promise.all([
        fetch(`/api/admin/expenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        fetch(`/api/admin/expenses?from=${encodeURIComponent(monthFrom)}&to=${encodeURIComponent(monthTo)}`),
        fetch(`/api/admin/expenses?from=${encodeURIComponent(yearFrom)}&to=${encodeURIComponent(yearTo)}`),
      ]);
      const [rList, rMonth, rYear] = await Promise.all([resList.json(), resMonth.json(), resYear.json()]);
      if (!resList.ok) throw new Error(rList.error ?? "Грешка при зареждане");
      if (!resMonth.ok) throw new Error(rMonth.error ?? "Грешка при зареждане");
      if (!resYear.ok) throw new Error(rYear.error ?? "Грешка при зареждане");
      setList(rList.expenses ?? []);
      setMonthRows(rMonth.expenses ?? []);
      setYearRows(rYear.expenses ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setErr("Въведете положителна сума.");
      return;
    }
    if (!description.trim()) {
      setErr("Описание е задължително.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          amount: n,
          description: description.trim(),
          supplier: supplier.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Грешка");
      setAmount("");
      setDescription("");
      setSupplier("");
      router.refresh();
      await load();
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Грешка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-card space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-brand-900">Разходи и отчети</h2>
      <p className="text-sm text-brand-800/85">
        Филтър по период за списъка. Месечният и годишният сбор са за календарния месец и годината на крайната дата
        (&quot;до&quot;).
      </p>
      {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{err}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-brand-800">От</label>
          <input
            className="input-admin tabular-nums"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-brand-800">До</label>
          <input className="input-admin tabular-nums" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="rounded-xl border border-brand-200/80 bg-brand-50/50 px-3 py-2 sm:col-span-2">
          <div className="text-xs font-medium text-brand-700">Сбор за периода</div>
          <div className="text-lg font-semibold tabular-nums text-brand-900">{periodSum.toFixed(2)} €</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-900/80">Месечен сбор</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-950">{monthSum.toFixed(2)} €</div>
          <p className="mt-1 text-xs text-emerald-900/75">Календарен месец на „до“</p>
        </div>
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-sky-900/80">Годишен сбор</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-sky-950">{yearSum.toFixed(2)} €</div>
          <p className="mt-1 text-xs text-sky-900/75">Календарна година на „до“</p>
        </div>
      </div>

      <form onSubmit={addExpense} className="grid gap-3 rounded-2xl border border-brand-200/70 bg-white/80 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label className="text-xs font-medium text-brand-800">Дата</label>
          <input className="input-admin" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-brand-800">Сума (€)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-brand-800">Описание</label>
          <input
            className="input-admin"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-brand-800">Доставчик (по избор)</label>
          <input className="input-admin" value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={200} />
        </div>
        <div className="flex items-end lg:col-span-6">
          <button type="submit" className="btn-admin-primary w-full sm:w-auto" disabled={saving}>
            {saving ? "Запис…" : "Добави разход"}
          </button>
        </div>
      </form>

      <div className="space-y-2 sm:hidden">
        {loading ? (
          <div className="rounded-xl border border-brand-200/80 px-3 py-6 text-center text-sm text-brand-600">Зареждане…</div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-brand-200/80 px-3 py-6 text-center text-sm text-brand-600">Няма разходи в избрания период.</div>
        ) : (
          list.map((e) => (
            <div key={e.id} className="rounded-xl border border-brand-200/80 bg-white/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-brand-900">{e.description}</p>
                <p className="text-sm font-semibold tabular-nums text-brand-900">{Number(e.amount).toFixed(2)} €</p>
              </div>
              <p className="mt-1 text-xs text-brand-700">Дата: {e.date}</p>
              <p className="mt-1 text-xs text-brand-700">Доставчик: {e.supplier ?? "—"}</p>
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-200 text-left text-xs text-brand-700">
              <th className="py-2 pr-2">Дата</th>
              <th className="py-2 pr-2">Описание</th>
              <th className="py-2 pr-2">Доставчик</th>
              <th className="py-2 text-right">Сума</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-brand-600">
                  Зареждане…
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-brand-600">
                  Няма разходи в избрания период.
                </td>
              </tr>
            ) : (
              list.map((e) => (
                <tr key={e.id} className="border-b border-brand-100">
                  <td className="py-2 pr-2 tabular-nums text-brand-900">{e.date}</td>
                  <td className="py-2 pr-2 text-brand-800">{e.description}</td>
                  <td className="py-2 pr-2 text-brand-700">{e.supplier ?? "—"}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-brand-900">
                    {Number(e.amount).toFixed(2)} €
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
