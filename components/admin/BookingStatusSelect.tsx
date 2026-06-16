"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BookingStatus } from "@/types";

const labels: Record<BookingStatus, string> = {
  pending: "Изчаква",
  confirmed: "Потвърдена",
  completed: "Яви се",
  cancelled: "Отказана",
  no_show: "Не се яви",
};

export function BookingStatusSelect(props: { bookingId: string; status: BookingStatus; compact?: boolean }) {
  const { bookingId, status: initial, compact } = props;
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function patch(next: BookingStatus) {
    if (next === status) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      setStatus(next);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "inline-flex w-full max-w-full flex-col gap-0.5" : "flex flex-col gap-1"}>
      <label className="sr-only">Статус на резервацията</label>
      <select
        className={
          compact
            ? "w-full min-h-[40px] cursor-pointer rounded-lg border border-brand-200/90 bg-white px-2 py-1.5 text-xs text-brand-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            : "input-admin !mt-0 max-w-[12rem] cursor-pointer py-2 text-sm"
        }
        value={status}
        disabled={loading}
        onChange={(e) => void patch(e.target.value as BookingStatus)}
        aria-busy={loading}
      >
        {(Object.keys(labels) as BookingStatus[]).map((k) => (
          <option key={k} value={k}>
            {labels[k]}
          </option>
        ))}
      </select>
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  );
}
