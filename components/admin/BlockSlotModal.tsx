"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminTimeSelect, buildTimeOptions } from "@/components/admin/AdminTimeSelect";
import { addCalendarDaysInSofia, todayDateISOInSofia } from "@/lib/booking-datetime";
import { timeToMinutes } from "@/lib/scheduling";
import type { BlockedSlot, WorkingHours } from "@/types";

type WeekDayHours = { start_time: string; end_time: string; is_day_off: boolean };

function workingRange(wh: WorkingHours | null | undefined): { from: string; to: string } {
  if (wh && !wh.is_day_off) {
    return { from: wh.start_time, to: wh.end_time };
  }
  return { from: "09:00", to: "19:00" };
}

function rangeForDate(date: string, week: WeekDayHours[] | null, fallback: WorkingHours | null | undefined) {
  if (week) {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const day = week[dayOfWeek];
    if (day && !day.is_day_off) {
      return { from: day.start_time, to: day.end_time };
    }
    return { from: "09:00", to: "19:00" };
  }
  return workingRange(fallback);
}

export function BlockSlotModal(props: {
  blockedDate: string;
  initialSlots: BlockedSlot[];
  workingHours?: WorkingHours | null;
  bookingWindowDays?: number;
  onClose: () => void;
}) {
  const { blockedDate, initialSlots, workingHours, bookingWindowDays = 30, onClose } = props;
  const router = useRouter();
  const today = todayDateISOInSofia();
  const maxDate = addCalendarDaysInSofia(today, bookingWindowDays);

  const [selectedDate, setSelectedDate] = useState(blockedDate);
  const [slotsForDate, setSlotsForDate] = useState<BlockedSlot[]>(initialSlots);
  const [weekHours, setWeekHours] = useState<WeekDayHours[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const range = useMemo(
    () => rangeForDate(selectedDate, weekHours, workingHours),
    [selectedDate, weekHours, workingHours],
  );
  const allTimes = useMemo(() => buildTimeOptions(range.from, range.to), [range.from, range.to]);

  const [start, setStart] = useState(() => allTimes.find((t) => t === "12:00") ?? allTimes[0] ?? "12:00");
  const [end, setEnd] = useState(() => {
    const idx = allTimes.indexOf("13:00");
    if (idx >= 0) return allTimes[idx]!;
    const afterNoon = allTimes.find((t) => timeToMinutes(t) > timeToMinutes(start));
    return afterNoon ?? allTimes[allTimes.length - 1] ?? "13:00";
  });
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endOptions = useMemo(
    () => allTimes.filter((t) => timeToMinutes(t) > timeToMinutes(start)),
    [allTimes, start],
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/working-hours")
      .then((res) => res.json() as Promise<{ days?: WeekDayHours[] }>)
      .then((json) => {
        if (!cancelled && json.days?.length === 7) setWeekHours(json.days);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedDate === blockedDate) {
      setSlotsForDate(initialSlots);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    void fetch(`/api/admin/blocked-slots?date=${encodeURIComponent(selectedDate)}`)
      .then((res) => res.json() as Promise<{ slots?: BlockedSlot[]; error?: string }>)
      .then((json) => {
        if (!cancelled) setSlotsForDate(json.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlotsForDate([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, blockedDate, initialSlots]);

  useEffect(() => {
    if (!allTimes.includes(start)) {
      setStart(allTimes.find((t) => t === "12:00") ?? allTimes[0] ?? "12:00");
    }
  }, [allTimes, start]);

  useEffect(() => {
    if (endOptions.length === 0) return;
    if (!endOptions.includes(end)) {
      setEnd(endOptions[0]!);
    }
  }, [end, endOptions]);

  async function add() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocked_date: selectedDate,
          start_time: start,
          end_time: end,
          reason: reason.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      setReason("");
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="block-slot-title"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Затвори" onClick={onClose} />
      <form
        className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-brand-200/80 bg-white shadow-xl sm:max-w-md sm:rounded-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <div className="overflow-y-auto px-5 pb-3 pt-5">
          <h2 id="block-slot-title" className="text-lg font-semibold text-brand-900">
            Блокирай час
          </h2>

          {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          <div className="mt-4">
            <label htmlFor="block-date" className="text-xs font-semibold text-brand-800">
              Дата
            </label>
            <input
              id="block-date"
              type="date"
              className="input-admin !mt-1.5 w-full py-3 text-base"
              value={selectedDate}
              min={today}
              max={maxDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              required
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <AdminTimeSelect id="block-start" label="От" value={start} options={allTimes} onChange={setStart} />
            <AdminTimeSelect id="block-end" label="До" value={end} options={endOptions.length > 0 ? endOptions : allTimes} onChange={setEnd} />
          </div>

          <div className="mt-3">
            <label htmlFor="block-reason" className="text-xs font-semibold text-brand-800">
              Причина (по желание)
            </label>
            <input
              id="block-reason"
              className="input-admin !mt-1.5 py-3 text-base"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Почивка, обяд…"
            />
          </div>

          {slotsLoading ? (
            <p className="mt-4 text-xs text-brand-700/75">Зареждане на блокировки…</p>
          ) : slotsForDate.length > 0 ? (
            <ul className="mt-4 max-h-24 space-y-1 overflow-y-auto rounded-xl bg-brand-50/80 px-3 py-2 text-xs text-brand-700">
              {slotsForDate.map((s) => (
                <li key={s.id}>
                  {s.start_time} – {s.end_time}
                  {s.reason ? ` · ${s.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-brand-700/75">Няма други блокировки за този ден.</p>
          )}
        </div>

        <div className="shrink-0 border-t border-brand-200/80 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex gap-2">
            <button type="button" className="btn-admin-ghost min-h-12 flex-1 text-base" onClick={onClose}>
              Отказ
            </button>
            <button type="submit" className="btn-admin-primary min-h-12 flex-[1.35] text-base font-semibold" disabled={loading}>
              {loading ? "Запазване…" : "Запази"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
