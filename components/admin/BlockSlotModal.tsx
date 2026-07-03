"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminTimeSelect, buildTimeOptions } from "@/components/admin/AdminTimeSelect";
import { timeToMinutes } from "@/lib/scheduling";
import type { BlockedSlot, WorkingHours } from "@/types";

function workingRange(wh: WorkingHours | null | undefined): { from: string; to: string } {
  if (wh && !wh.is_day_off) {
    return { from: wh.start_time, to: wh.end_time };
  }
  return { from: "09:00", to: "19:00" };
}

export function BlockSlotModal(props: {
  blockedDate: string;
  initialSlots: BlockedSlot[];
  workingHours?: WorkingHours | null;
  onClose: () => void;
}) {
  const { blockedDate, initialSlots, workingHours, onClose } = props;
  const router = useRouter();
  const range = useMemo(() => workingRange(workingHours), [workingHours]);
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
          blocked_date: blockedDate,
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
          <p className="mt-1 text-sm text-brand-700">Дата: {blockedDate}</p>

          {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

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

          {initialSlots.length > 0 ? (
            <ul className="mt-4 max-h-24 space-y-1 overflow-y-auto rounded-xl bg-brand-50/80 px-3 py-2 text-xs text-brand-700">
              {initialSlots.map((s) => (
                <li key={s.id}>
                  {s.start_time} – {s.end_time}
                  {s.reason ? ` · ${s.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
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
