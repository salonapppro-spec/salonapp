"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DAY_NAMES = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"] as const;

type Day = { start_time: string; end_time: string; is_day_off: boolean };

export function WorkingHoursForm(props: { initialDays: Day[] }) {
  const router = useRouter();
  const [days, setDays] = useState<Day[]>(props.initialDays);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function update(i: number, patch: Partial<Day>) {
    setDays((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  async function save() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const normalized = days.map((d) => ({
        ...d,
        start_time: d.start_time.slice(0, 5),
        end_time: d.end_time.slice(0, 5),
      }));
      const res = await fetch("/api/admin/working-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: normalized }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка при запис");
      setOk("Запазено.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-card">
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">{error}</div> : null}
      {ok ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">{ok}</div> : null}

      <div className="space-y-4">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-brand-200/70 bg-brand-50/40 p-4 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <div className="min-w-[8rem] font-medium text-brand-900">{DAY_NAMES[i]}</div>
            <label className="flex items-center gap-2 text-sm text-brand-800">
              <input type="checkbox" checked={d.is_day_off} onChange={(e) => update(i, { is_day_off: e.target.checked })} />
              Почивен ден
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-brand-700/80">От</label>
              <input
                type="time"
                className="input-admin !mt-0 max-w-[9rem] py-2 text-sm"
                disabled={d.is_day_off}
                value={d.start_time}
                onChange={(e) => update(i, { start_time: e.target.value })}
              />
              <label className="text-xs text-brand-700/80">До</label>
              <input
                type="time"
                className="input-admin !mt-0 max-w-[9rem] py-2 text-sm"
                disabled={d.is_day_off}
                value={d.end_time}
                onChange={(e) => update(i, { end_time: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-admin-primary mt-8 w-full sm:w-auto sm:px-10" disabled={loading} onClick={() => void save()}>
        {loading ? "Запазване…" : "Запази графика"}
      </button>
    </div>
  );
}
