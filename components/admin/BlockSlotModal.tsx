"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BlockedSlot } from "@/types";

export function BlockSlotModal(props: {
  blockedDate: string;
  initialSlots: BlockedSlot[];
  onClose: () => void;
}) {
  const { blockedDate, initialSlots, onClose } = props;
  const router = useRouter();
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("13:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Затвори" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-brand-200/80 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-brand-900">Блокирай период</h2>
        <p className="mt-1 text-sm text-brand-700">Дата: {blockedDate}</p>
        {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <label className="text-xs font-medium text-brand-800">От</label>
            <input type="time" className="input-admin !mt-1" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">До</label>
            <input type="time" className="input-admin !mt-1" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-xs font-medium text-brand-800">Причина</label>
            <input className="input-admin !mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Почивка…" />
          </div>
        </div>
        {initialSlots.length > 0 ? (
          <ul className="mt-3 max-h-28 overflow-y-auto text-xs text-brand-700">
            {initialSlots.map((s) => (
              <li key={s.id}>
                {s.start_time} – {s.end_time}
                {s.reason ? ` · ${s.reason}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button type="button" className="btn-admin-ghost flex-1" onClick={onClose}>
            Отказ
          </button>
          <button type="button" className="btn-admin-primary flex-1" disabled={loading} onClick={() => void add()}>
            {loading ? "…" : "Блокирай"}
          </button>
        </div>
      </div>
    </div>
  );
}
