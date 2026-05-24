import Link from "next/link";

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
  const { initialSettings: s, services } = props;

  const overhead = totalMonthlyOverheadEur({
    rent_eur: s.rent_eur,
    electricity_eur: s.electricity_eur,
    water_eur: s.water_eur,
    accounting_eur: s.accounting_eur,
    desired_salary: s.desired_salary,
    other_monthly_expenses: s.monthly_expenses,
  });

  const minutes = productiveMinutesPerMonth(s.working_days_per_week, s.working_hours_per_day);
  const cpm = costPerMinuteEur(overhead, minutes);
  const rows = buildAbcRows(services, cpm, s.vat_enabled);
  const daysPm = averageWorkingDaysPerMonth(s.working_days_per_week);

  return (
    <div className="space-y-8">
      <section className="admin-card">
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">ABC калкулатор</h2>
        <p className="mt-1 text-sm text-brand-800/85">
          Разход на минута: <strong className="tabular-nums">{cpm.toFixed(4)} €</strong> · Продуктивни минути /
          месец: <strong>{minutes}</strong> · Общо месечни разходи:{" "}
          <strong className="tabular-nums">{overhead.toFixed(2)} €</strong> (~{daysPm.toFixed(1)} раб. дни/месец).{" "}
          <Link
            href="/admin/settings#fixed-costs"
            className="text-brand-600 underline underline-offset-2 hover:text-brand-800"
          >
            Промени параметрите →
          </Link>
        </p>

        {overhead === 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            Разходните параметри са нулеви.{" "}
            <Link
              href="/admin/settings#fixed-costs"
              className="font-semibold underline underline-offset-2"
            >
              Задайте ги в Настройки → Фиксирани разходи
            </Link>{" "}
            за реален ABC анализ.
          </div>
        ) : null}

        <div className="mt-4 space-y-2 sm:hidden">
          {rows.map((r) => (
            <div key={r.serviceId} className={`rounded-xl border border-brand-200/80 p-3 ${rowClass(r.marginBand)}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm font-semibold tabular-nums">{r.marginPercent.toFixed(1)}%</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <p>
                  Мин: <strong className="tabular-nums">{r.durationMin}</strong>
                </p>
                <p>
                  Бруто: <strong className="tabular-nums">{r.priceGrossEur.toFixed(2)}€</strong>
                </p>
                <p>
                  Нето: <strong className="tabular-nums">{r.priceNetEur.toFixed(2)}€</strong>
                </p>
                <p>
                  Себест.: <strong className="tabular-nums">{r.costEur.toFixed(2)}€</strong>
                </p>
                <p className="col-span-2">
                  Печалба: <strong className="tabular-nums">{r.profitEur.toFixed(2)}€</strong>
                </p>
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
        <strong>Задължителна бележка за СУПТО:</strong> Тази справка е само за вътрешна информация и управленски
        анализ. Не замества счетоводен одит, счетоводна политика, НСС, фискални отчети или изисквания на НАП.
        Маржовете и „себестойностите" са ориентировъчни по метода на разпределение на постоянните разходи върху
        минутите.
      </section>
    </div>
  );
}
