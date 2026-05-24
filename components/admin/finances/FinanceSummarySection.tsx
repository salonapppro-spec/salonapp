import Link from "next/link";

import { formatCalendarMonthBg } from "@/lib/finance-dates";

type DayPoint = { key: string; amount: number; label: string };

function goalTone(goal: number, actual: number): "neutral" | "bad" | "mid" | "good" {
  if (goal <= 0) return "neutral";
  const r = actual / goal;
  if (r >= 1) return "good";
  if (r >= 0.85) return "mid";
  return "bad";
}

export function FinanceSummarySection(props: {
  dayRev: number;
  weekRev: number;
  monthRev: number;
  monthExpenses: number;
  overhead: number;
  revenueGoal: number;
  year: number;
  month: number;
  daily: DayPoint[];
}) {
  const { dayRev, weekRev, monthRev, monthExpenses, overhead, revenueGoal, daily } = props;
  const netProfit = monthRev - overhead - monthExpenses;
  const tone = goalTone(revenueGoal, monthRev);
  const revenueRing =
    tone === "good"
      ? "ring-emerald-300/80 bg-emerald-50/90"
      : tone === "mid"
        ? "ring-amber-300/80 bg-amber-50/90"
        : tone === "bad"
          ? "ring-red-300/80 bg-red-50/90"
          : "ring-brand-200/80 bg-white";

  const max = Math.max(1, ...daily.map((d) => d.amount));

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight text-brand-900">Обобщение</h2>

      {/* Бързи карти: ден / седмица / месец */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="admin-card py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Днес</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{dayRev.toFixed(2)} €</div>
        </div>
        <div className="admin-card py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Тази седмица</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{weekRev.toFixed(2)} €</div>
        </div>
        <div className={["admin-card py-5 ring-2", revenueRing].join(" ")}>
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Оборот месец</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{monthRev.toFixed(2)} €</div>
          {revenueGoal > 0 ? (
            <p className="mt-2 text-xs text-brand-800/90">
              Цел: {revenueGoal.toFixed(2)} € ({((monthRev / revenueGoal) * 100).toFixed(0)}%)
            </p>
          ) : (
            <p className="mt-2 text-xs text-brand-600">
              <Link href="/admin/settings#fixed-costs" className="underline underline-offset-2 hover:text-brand-800">
                Задайте месечна цел →
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Разбивка: оборот − постоянни − фактури = чиста печалба */}
      <div className="admin-card divide-y divide-brand-100">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-brand-800">Оборот (завършени резервации)</span>
          <span className="tabular-nums font-medium text-brand-900">{monthRev.toFixed(2)} €</span>
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-brand-800">
            − Постоянни разходи{" "}
            <Link
              href="/admin/settings#fixed-costs"
              className="text-brand-500 hover:text-brand-700"
              title="Редактирай в Настройки"
            >
              ✎
            </Link>
          </span>
          {overhead === 0 ? (
            <Link
              href="/admin/settings#fixed-costs"
              className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
            >
              Не са зададени →
            </Link>
          ) : (
            <span className="tabular-nums font-medium text-brand-700">− {overhead.toFixed(2)} €</span>
          )}
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-brand-800">− Разходни фактури (въведени)</span>
          <span className="tabular-nums font-medium text-brand-700">− {monthExpenses.toFixed(2)} €</span>
        </div>

        <div className="flex items-center justify-between pt-4 pb-2">
          <span className="text-base font-semibold text-brand-900">Чиста печалба</span>
          <span
            className={[
              "text-xl font-bold tabular-nums",
              netProfit >= 0 ? "text-emerald-700" : "text-red-700",
            ].join(" ")}
          >
            {netProfit >= 0 ? "" : "− "}
            {Math.abs(netProfit).toFixed(2)} €
          </span>
        </div>

        {overhead === 0 ? (
          <p className="pt-3 pb-1 text-xs text-amber-800/90">
            ⚠ Постоянните разходи не са попълнени — числото не отразява реалната печалба.{" "}
            <Link href="/admin/settings#fixed-costs" className="font-semibold underline underline-offset-2">
              Задайте ги в Настройки
            </Link>
            .
          </p>
        ) : null}
      </div>

      {/* Графика оборот по дни */}
      <div className="admin-card">
        <h3 className="text-sm font-semibold text-brand-900">
          Оборот по дни — {formatCalendarMonthBg(props.year, props.month)}
        </h3>
        <div className="mt-4 flex h-40 items-end gap-0.5 overflow-x-auto pb-1">
          {daily.map((d) => (
            <div key={d.key} className="flex min-w-[1.1rem] flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full min-w-[6px] rounded-t bg-brand-500/90"
                style={{ height: `${(d.amount / max) * 100}%`, minHeight: d.amount > 0 ? "4px" : "0" }}
                title={`${d.key}: ${d.amount.toFixed(2)} €`}
              />
              <span className="text-[9px] text-brand-600">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
