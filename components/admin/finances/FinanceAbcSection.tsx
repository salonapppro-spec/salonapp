"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  averageWorkingDaysPerMonth,
  buildAbcRows,
  costPerMinuteEur,
  productiveMinutesPerMonth,
  totalMonthlyOverheadEur,
} from "@/lib/finance-abc";
import type { FinancialSettings } from "@/types/database";
import type { Service } from "@/types";

function rowClass(band: "low" | "mid" | "high"): string {
  if (band === "low") return "bg-red-50/90 text-red-950";
  if (band === "mid") return "bg-amber-50/90 text-amber-950";
  return "bg-emerald-50/90 text-emerald-950";
}

export function FinanceAbcSection(props: { initialSettings: FinancialSettings; services: Service[] }) {
  const router = useRouter();
  const [s, setS] = useState({
    rent_eur: props.initialSettings.rent_eur,
    electricity_eur: props.initialSettings.electricity_eur,
    water_eur: props.initialSettings.water_eur,
    accounting_eur: props.initialSettings.accounting_eur,
    monthly_expenses: props.initialSettings.monthly_expenses,
    desired_salary: props.initialSettings.desired_salary,
    working_days_per_week: props.initialSettings.working_days_per_week,
    working_hours_per_day: props.initialSettings.working_hours_per_day,
    vat_enabled: props.initialSettings.vat_enabled,
    monthly_revenue_goal_eur: props.initialSettings.monthly_revenue_goal_eur,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const overhead = useMemo(
    () =>
      totalMonthlyOverheadEur({
        rent_eur: s.rent_eur,
        electricity_eur: s.electricity_eur,
        water_eur: s.water_eur,
        accounting_eur: s.accounting_eur,
        desired_salary: s.desired_salary,
        other_monthly_expenses: s.monthly_expenses,
      }),
    [s]
  );

  const minutes = useMemo(
    () => productiveMinutesPerMonth(s.working_days_per_week, s.working_hours_per_day),
    [s.working_days_per_week, s.working_hours_per_day]
  );

  const cpm = useMemo(() => costPerMinuteEur(overhead, minutes), [overhead, minutes]);

  const rows = useMemo(() => buildAbcRows(props.services, cpm, s.vat_enabled), [props.services, cpm, s.vat_enabled]);

  const daysPm = averageWorkingDaysPerMonth(s.working_days_per_week);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/financial-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rent_eur: s.rent_eur,
          electricity_eur: s.electricity_eur,
          water_eur: s.water_eur,
          accounting_eur: s.accounting_eur,
          monthly_expenses: s.monthly_expenses,
          desired_salary: s.desired_salary,
          working_days_per_week: s.working_days_per_week,
          working_hours_per_day: s.working_hours_per_day,
          vat_enabled: s.vat_enabled,
          monthly_revenue_goal_eur: s.monthly_revenue_goal_eur,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Грешка");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Грешка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="admin-card space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">Постоянни разходи и параметри</h2>
        <p className="text-sm text-brand-800/85">
          Месечни суми (EUR). „Други разходи“ са прочие освен изброените. Работни дни/часове определят разпределението на
          разхода върху минутите (~{daysPm.toFixed(1)} дни / месец при текущия график).
        </p>
        {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{err}</div> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["rent_eur", "Наем"],
              ["electricity_eur", "Ток"],
              ["water_eur", "Вода"],
              ["accounting_eur", "Счетоводство"],
              ["monthly_expenses", "Други месечни"],
              ["desired_salary", "Желана заплата"],
            ] as const
          ).map(([k, label]) => (
            <div key={k}>
              <label className="text-xs font-medium text-brand-800">{label}</label>
              <input
                className="input-admin tabular-nums"
                inputMode="decimal"
                value={String(s[k])}
                onChange={(e) => setS((p) => ({ ...p, [k]: Number(e.target.value) || 0 }))}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-brand-800">Работни дни / седмица</label>
            <input
              className="input-admin tabular-nums"
              inputMode="numeric"
              value={s.working_days_per_week}
              onChange={(e) => setS((p) => ({ ...p, working_days_per_week: Number(e.target.value) || 1 }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">Работни часове / ден</label>
            <input
              className="input-admin tabular-nums"
              inputMode="numeric"
              value={s.working_hours_per_day}
              onChange={(e) => setS((p) => ({ ...p, working_hours_per_day: Number(e.target.value) || 1 }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">Месечна цел — оборот (€)</label>
            <input
              className="input-admin tabular-nums"
              inputMode="decimal"
              value={s.monthly_revenue_goal_eur}
              onChange={(e) => setS((p) => ({ ...p, monthly_revenue_goal_eur: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="vat-fin"
              type="checkbox"
              checked={s.vat_enabled}
              onChange={(e) => setS((p) => ({ ...p, vat_enabled: e.target.checked }))}
            />
            <label htmlFor="vat-fin" className="text-sm text-brand-900">
              ДДС режим (20%) — маржът се смята върху нетна цена
            </label>
          </div>
        </div>
        <button type="button" className="btn-admin-primary" disabled={saving} onClick={() => void save()}>
          {saving ? "Запазване…" : "Запази параметрите"}
        </button>
      </section>

      <section className="admin-card">
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">ABC калкулатор</h2>
        <p className="mt-1 text-sm text-brand-800/85">
          Разход на минута: <strong className="tabular-nums">{cpm.toFixed(4)} €</strong> · Продуктивни минути / месец:{" "}
          <strong>{minutes}</strong> · Общо месечни разходи: <strong className="tabular-nums">{overhead.toFixed(2)} €</strong>
        </p>
        <div className="mt-4 space-y-2 sm:hidden">
          {rows.map((r) => (
            <div key={r.serviceId} className={`rounded-xl border border-brand-200/80 p-3 ${rowClass(r.marginBand)}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm font-semibold tabular-nums">{r.marginPercent.toFixed(1)}%</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <p>Мин: <strong className="tabular-nums">{r.durationMin}</strong></p>
                <p>Бруто: <strong className="tabular-nums">{r.priceGrossEur.toFixed(2)}€</strong></p>
                <p>Нето: <strong className="tabular-nums">{r.priceNetEur.toFixed(2)}€</strong></p>
                <p>Себест.: <strong className="tabular-nums">{r.costEur.toFixed(2)}€</strong></p>
                <p className="col-span-2">Печалба: <strong className="tabular-nums">{r.profitEur.toFixed(2)}€</strong></p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-200 text-left text-xs text-brand-700">
                <th className="py-2 pr-2">Услуга</th>
                <th className="py-2 pr-2">Мин.</th>
                <th className="py-2 pr-2">Цена (бруто)</th>
                <th className="py-2 pr-2">Нето</th>
                <th className="py-2 pr-2">Себестойност</th>
                <th className="py-2 pr-2">Печалба</th>
                <th className="py-2">Марж %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.serviceId} className={["border-b border-brand-100", rowClass(r.marginBand)].join(" ")}>
                  <td className="py-2 pr-2 font-medium">{r.name}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.durationMin}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.priceGrossEur.toFixed(2)}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.priceNetEur.toFixed(2)}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.costEur.toFixed(2)}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.profitEur.toFixed(2)}</td>
                  <td className="py-2 tabular-nums font-semibold">{r.marginPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-brand-700/85">
          Индикатор: &lt;20% марж червено, 20–40% жълто, &gt;40% зелено. Сложни услуги — средна продължителност от
          мин/макс фази.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm leading-relaxed text-amber-950 shadow-card sm:p-5">
        <strong>Задължителна бележка за СУПТО:</strong> Тази справка е само за вътрешна информация и управленски анализ.
        Не замества счетоводен одит, счетоводна политика, НСС, фискални отчети или изисквания на НАП. Маржовете и
        „себестойностите“ са ориентировъчни по метода на разпределение на постоянните разходи върху минутите.
      </section>
    </div>
  );
}
