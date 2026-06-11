"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MinNoticeCard(props: { initialMinutes: number }) {
  const router = useRouter();
  const [minNotice, setMinNotice] = useState(String(props.initialMinutes));
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
        body: JSON.stringify({ booking_min_notice_minutes: Number(minNotice) }),
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
        ⏱ Минимално предизвестие
      </h2>
      <p className="mt-1.5 text-xs text-[#1A1A1A]/50">
        Колко рано най-късно клиент може да запази час за днес. По-кратко = повече спонтанни клиенти, но по-малко време за реакция.
      </p>

      {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-xs text-red-900">{error}</div> : null}
      {ok ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-900">{ok}</div> : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
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
          </select>
        </div>
        <button
          type="button"
          className="btn-admin-primary shrink-0"
          disabled={loading}
          onClick={() => void save()}
        >
          {loading ? "Запазване…" : "Запази"}
        </button>
      </div>
    </div>
  );
}
