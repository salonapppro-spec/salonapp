"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { FinancialSettings } from "@/types";

export function FinancialSettingsForm(props: {
  settings: FinancialSettings | null;
  /** Само буфер / прозорец / магнитен график (за страница Настройки). */
  variant?: "full" | "booking";
}) {
  const router = useRouter();
  const variant = props.variant ?? "full";
  const s = props.settings;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [buffer, setBuffer] = useState(String(s?.buffer_minutes ?? 10));
  const [bookingWindow, setBookingWindow] = useState(String(s?.booking_window_days ?? 30));
  const [magnetic, setMagnetic] = useState(Boolean(s?.magnetic_scheduling ?? true));
  const [vat, setVat] = useState(Boolean(s?.vat_enabled ?? false));
  const [workDays, setWorkDays] = useState(String(s?.working_days_per_week ?? 5));
  const [hoursPerDay, setHoursPerDay] = useState(String(s?.working_hours_per_day ?? 8));
  const [monthlyExp, setMonthlyExp] = useState(String(s?.monthly_expenses ?? 0));
  const [salary, setSalary] = useState(String(s?.desired_salary ?? 0));

  const payload = useMemo(
    () => ({
      buffer_minutes: Number(buffer),
      booking_window_days: Number(bookingWindow),
      magnetic_scheduling: magnetic,
      vat_enabled: vat,
      working_days_per_week: Number(workDays),
      working_hours_per_day: Number(hoursPerDay),
      monthly_expenses: Number(monthlyExp),
      desired_salary: Number(salary),
    }),
    [buffer, bookingWindow, magnetic, vat, workDays, hoursPerDay, monthlyExp, salary]
  );

  async function save() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/financial-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      setOk("Запазено.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  const bookingOnly = variant === "booking";

  return (
    <div className={bookingOnly ? "admin-card" : "admin-card mt-8"}>
      <h2 className="text-lg font-semibold tracking-tight text-brand-900">
        {bookingOnly ? "Резервации и график" : "Настройки за резервации и обобщение"}
      </h2>
      <p className="mt-1 text-sm text-brand-800/85">
        {bookingOnly
          ? "Буферът, прозорецът и магнитният график се отразяват веднага на публичния сайт."
          : "Буфер и прозорец за онлайн запис влияят на публичния календар. Останалите полета са за бъдещ ABC анализ."}
      </p>

      {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">{error}</div> : null}
      {ok ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">{ok}</div> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-brand-900">Буфер между резервации (мин.)</label>
          <input className="input-admin" inputMode="numeric" value={buffer} onChange={(e) => setBuffer(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Прозорец за резервация (дни напред)</label>
          <input className="input-admin" inputMode="numeric" value={bookingWindow} onChange={(e) => setBookingWindow(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input id="mag" type="checkbox" checked={magnetic} onChange={(e) => setMagnetic(e.target.checked)} />
          <label htmlFor="mag" className="text-sm text-brand-900">
            Магнитно планиране (предпочитани часове до съседни резервации)
          </label>
        </div>
        {!bookingOnly ? (
          <>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input id="vat" type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} />
              <label htmlFor="vat" className="text-sm text-brand-900">
                ДДС (информативно за бъдещи изчисления)
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Работни дни / седмица</label>
              <input className="input-admin" inputMode="numeric" value={workDays} onChange={(e) => setWorkDays(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Работни часове / ден</label>
              <input className="input-admin" inputMode="numeric" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Месечни разходи (€)</label>
              <input className="input-admin" inputMode="decimal" value={monthlyExp} onChange={(e) => setMonthlyExp(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Целева заплата (€)</label>
              <input className="input-admin" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
          </>
        ) : null}
      </div>

      <button type="button" className="btn-admin-primary mt-6 w-full sm:w-auto" disabled={loading} onClick={() => void save()}>
        {loading ? "Запазване…" : "Запази настройките"}
      </button>
    </div>
  );
}
