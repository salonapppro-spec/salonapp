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
  revenueGoal: number;
  year: number;
  month: number;
  daily: DayPoint[];
}) {
  const { dayRev, weekRev, monthRev, revenueGoal, daily } = props;
  const tone = goalTone(revenueGoal, monthRev);
  const ring =
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
      <p className=”text-sm text-brand-800/85”>Прогнозна стойност само от резервации със статус „Завършено” (completed).</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="admin-card py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Днес</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{dayRev.toFixed(2)} €</div>
        </div>
        <div className="admin-card py-5">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Тази седмица</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{weekRev.toFixed(2)} €</div>
        </div>
        <div className={["admin-card py-5 ring-2", ring].join(" ")}>
          <div className="text-xs font-medium uppercase tracking-wide text-brand-700/80">Този месец</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-brand-900">{monthRev.toFixed(2)} €</div>
          {revenueGoal > 0 ? (
            <p className="mt-2 text-xs text-brand-800/90">
              Цел: {revenueGoal.toFixed(2)} € ({((monthRev / revenueGoal) * 100).toFixed(0)}%)
            </p>
          ) : (
            <p className="mt-2 text-xs text-brand-600">Задайте месечна цел в „Постоянни разходи“.</p>
          )}
        </div>
      </div>

      <div className="admin-card">
        <h3 className="text-sm font-semibold text-brand-900">
          Прогноза по дни — {props.month}.{props.year}
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
