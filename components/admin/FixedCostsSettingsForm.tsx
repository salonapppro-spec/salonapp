"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAdminBasePath } from "@/lib/admin-base-path";
import type { FinancialSettings } from "@/types";

export function FixedCostsSettingsForm({ settings }: { settings: FinancialSettings | null }) {
  const router = useRouter();
  const basePath = useAdminBasePath();
  const s = settings;

  const [rent, setRent] = useState(String(s?.rent_eur ?? 0));
  const [electricity, setElectricity] = useState(String(s?.electricity_eur ?? 0));
  const [water, setWater] = useState(String(s?.water_eur ?? 0));
  const [accounting, setAccounting] = useState(String(s?.accounting_eur ?? 0));
  const [monthlyExp, setMonthlyExp] = useState(String(s?.monthly_expenses ?? 0));
  const [salary, setSalary] = useState(String(s?.desired_salary ?? 0));
  const [workDays, setWorkDays] = useState(String(s?.working_days_per_week ?? 5));
  const [hoursPerDay, setHoursPerDay] = useState(String(s?.working_hours_per_day ?? 8));
  const [revenueGoal, setRevenueGoal] = useState(String(s?.monthly_revenue_goal_eur ?? 0));
  const [vat, setVat] = useState(Boolean(s?.vat_enabled ?? false));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/financial-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rent_eur: Number(rent),
          electricity_eur: Number(electricity),
          water_eur: Number(water),
          accounting_eur: Number(accounting),
          monthly_expenses: Number(monthlyExp),
          desired_salary: Number(salary),
          working_days_per_week: Number(workDays),
          working_hours_per_day: Number(hoursPerDay),
          monthly_revenue_goal_eur: Number(revenueGoal),
          vat_enabled: vat,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      setOk("Параметрите са запазени.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="fixed-costs" className="admin-card">
      <h2 className="text-lg font-semibold tracking-tight text-brand-900">Фиксирани месечни разходи</h2>
      <p className="mt-1 text-sm text-brand-800/85">
        Попълнете веднъж. Системата ги използва в{" "}
        <Link href={`${basePath}/finances`} className="underline underline-offset-2 hover:text-brand-700">
          ABC калкулатора
        </Link>{" "}
        за изчисление на себестойността на всяка услуга.
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
          {ok}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-brand-900">Наем (€/мес.)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Ток (€/мес.)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={electricity}
            onChange={(e) => setElectricity(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Вода (€/мес.)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={water}
            onChange={(e) => setWater(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Счетоводство (€/мес.)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={accounting}
            onChange={(e) => setAccounting(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Други месечни разходи (€)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={monthlyExp}
            onChange={(e) => setMonthlyExp(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Желана заплата (€/мес.)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Работни дни / седмица</label>
          <input
            className="input-admin tabular-nums"
            inputMode="numeric"
            placeholder="5"
            value={workDays}
            onChange={(e) => setWorkDays(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Работни часове / ден</label>
          <input
            className="input-admin tabular-nums"
            inputMode="numeric"
            placeholder="8"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-900">Месечна цел — прогнозна стойност (€)</label>
          <input
            className="input-admin tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={revenueGoal}
            onChange={(e) => setRevenueGoal(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
          <input
            id="vat-fixed-costs"
            type="checkbox"
            checked={vat}
            onChange={(e) => setVat(e.target.checked)}
          />
          <label htmlFor="vat-fixed-costs" className="text-sm text-brand-900">
            ДДС режим (20%) — маржът в ABC се смята върху нетна цена
          </label>
        </div>
      </div>

      <button
        type="button"
        className="btn-admin-primary mt-8 w-full"
        disabled={loading}
        onClick={() => void save()}
      >
        {loading ? "Запазване…" : "Запази параметрите"}
      </button>
    </div>
  );
}
