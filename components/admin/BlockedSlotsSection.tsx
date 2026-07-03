"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminTimeSelect, buildTimeOptions } from "@/components/admin/AdminTimeSelect";
import { timeToMinutes } from "@/lib/scheduling";
import type { BlockedSlot } from "@/types";

export function BlockedSlotsSection(props: { blockedDate: string; initialSlots: BlockedSlot[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState(props.initialSlots);
  const allTimes = useMemo(() => buildTimeOptions("06:00", "22:00"), []);

  useEffect(() => {
    setSlots(props.initialSlots);
  }, [props.initialSlots]);

  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("13:00");
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
          blocked_date: props.blockedDate,
          start_time: start,
          end_time: end,
          reason: reason.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string; slot?: BlockedSlot };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      if (json.slot) setSlots((s) => [...s, json.slot!].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/blocked-slots/${id}`, { method: "DELETE" });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json?.error ?? "Грешка");
      return;
    }
    setSlots((s) => s.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="mt-4 border-t border-brand-200/60 pt-4">
      <h3 className="text-sm font-semibold text-brand-900">Блокирани интервали за този ден</h3>
      <p className="mt-1 text-xs text-brand-700/80">Клиентите няма да могат да резервират в тези часове.</p>

      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}

      <ul className="mt-3 space-y-2 text-sm">
        {slots.length === 0 ? <li className="text-brand-700/75">Няма блокировки.</li> : null}
        {slots.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200/60 bg-white px-3 py-2">
            <span>
              {s.start_time} – {s.end_time}
              {s.reason ? <span className="text-brand-700/80"> · {s.reason}</span> : null}
            </span>
            <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => void remove(s.id)}>
              Премахни
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-4 rounded-xl border border-brand-200/70 bg-brand-50/50 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <AdminTimeSelect id="blocked-start" label="От" value={start} options={allTimes} onChange={setStart} />
          <AdminTimeSelect
            id="blocked-end"
            label="До"
            value={end}
            options={endOptions.length > 0 ? endOptions : allTimes}
            onChange={setEnd}
          />
        </div>
        <div className="mt-3">
          <label htmlFor="blocked-reason" className="text-xs font-semibold text-brand-800">
            Причина (по желание)
          </label>
          <input
            id="blocked-reason"
            className="input-admin !mt-1.5 py-3 text-base"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Обяд, почивка…"
          />
        </div>
        <button type="submit" className="btn-admin-primary mt-4 min-h-12 w-full text-base font-semibold" disabled={loading}>
          {loading ? "Запазване…" : "Запази"}
        </button>
      </form>
    </div>
  );
}
