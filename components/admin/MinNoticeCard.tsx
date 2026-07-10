"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MinNoticeCard(props: {
  initialMinutes: number;
  initialBuffer: number;
  initialBookingWindow: number;
  initialMagnetic: boolean;
}) {
  const router = useRouter();
  const [minNotice, setMinNotice] = useState(String(props.initialMinutes));
  const [buffer, setBuffer] = useState(String(props.initialBuffer));
  const [bookingWindow, setBookingWindow] = useState(String(props.initialBookingWindow));
  const [magnetic, setMagnetic] = useState(props.initialMagnetic);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setOk(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/financial-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_min_notice_minutes: Number(minNotice),
          buffer_minutes: Number(buffer),
          booking_window_days: Number(bookingWindow),
          magnetic_scheduling: magnetic,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      setOk("Запазено.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mt-4 rounded-2xl bg-white p-4 sm:p-5"
      style={{
        border: "1px solid rgba(201,168,76,0.18)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
      }}
    >
      <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: "#C9A84C" }}>
        ⚙️ Настройки за резервации
      </h2>
      <p className="mt-1.5 text-xs text-[#1A1A1A]/50">
        Буферът, прозорецът и магнитният график се отразяват веднага на публичния сайт.
      </p>

      {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-xs text-red-900">{error}</div> : null}
      {ok ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-900">{ok}</div> : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-[#1A1A1A]/75">Буфер между резервации (мин.)</label>
          <input
            className="input-admin mt-1"
            inputMode="numeric"
            value={buffer}
            onChange={(e) => { setBuffer(e.target.value); setOk(null); }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#1A1A1A]/75">Прозорец за резервация (дни напред)</label>
          <input
            className="input-admin mt-1"
            inputMode="numeric"
            value={bookingWindow}
            onChange={(e) => { setBookingWindow(e.target.value); setOk(null); }}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-[#1A1A1A]/75">Минимално предизвестие за онлайн запис</label>
          <select
            className="input-admin mt-1"
            value={minNotice}
            onChange={(e) => { setMinNotice(e.target.value); setOk(null); }}
          >
            <option value="0">Без ограничение — час може да се запази веднага</option>
            <option value="15">15 минути напред</option>
            <option value="30">30 минути напред (препоръчително)</option>
            <option value="60">1 час напред</option>
            <option value="120">2 часа напред</option>
            {!["0", "15", "30", "60", "120"].includes(minNotice) && (
              <option value={minNotice}>{minNotice} минути напред (текуща настройка)</option>
            )}
          </select>
          <p className="mt-1 text-xs text-[#1A1A1A]/45">
            Колко рано най-късно клиент може да запази час за днес.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="mag-cal"
            type="checkbox"
            checked={magnetic}
            onChange={(e) => { setMagnetic(e.target.checked); setOk(null); }}
          />
          <label htmlFor="mag-cal" className="text-sm text-[#1A1A1A]/75">
            Магнитно планиране (предпочитани часове до съседни резервации)
          </label>
        </div>
      </div>

      <button
        type="button"
        className="btn-admin-primary mt-5 w-full sm:w-auto"
        disabled={loading}
        onClick={() => void save()}
      >
        {loading ? "Запазване…" : "Запази настройките"}
      </button>
    </div>
  );
}
