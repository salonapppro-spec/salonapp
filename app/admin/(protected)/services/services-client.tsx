"use client";

import { useMemo, useState } from "react";

import type { Service } from "@/types";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

export function ServicesClient(props: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(props.initialServices);

  /* add form */
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(false);

  /* per-row */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => services.filter((s) => s.is_active), [services]);
  const inactive = useMemo(() => services.filter((s) => !s.is_active), [services]);

  async function refresh() {
    const res = await fetch("/api/admin/services");
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Грешка");
    setServices(json.services ?? []);
  }

  async function add() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price_eur: Number(price),
          duration_minutes: Number(duration),
          is_complex: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно");
      setName("");
      setPrice("");
      setDuration("60");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    setError(null);
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json?.error ?? "Грешка"); return; }
    await refresh();
  }

  async function patchService(id: string, patch: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) { setError(json?.error ?? "Грешка"); return; }
    setEditingId(null);
    await refresh();
  }

  async function removeInactive(id: string, label: string) {
    if (!window.confirm(`Да изтрием изцяло услугата „${label}"? Стари резервации ще останат.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      )}

      {/* ── Добави услуга ── */}
      <div
        className="rounded-2xl bg-white p-5"
        style={{
          border: "1px solid rgba(201,168,76,0.18)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="mb-4 flex items-center gap-3 border-b pb-4"
          style={{ borderColor: "rgba(201,168,76,0.12)" }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))" }}
          >
            ✂️
          </div>
          <div>
            <h2 className="text-sm font-black text-[#1A1A1A]">Нова услуга</h2>
            <p className="mt-0.5 text-xs text-[#1A1A1A]/45">Попълни трите полета и натисни „Добави".</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
              Услуга
            </label>
            <input
              className="input-admin mt-1"
              placeholder="Боядисване, подстригване…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
              Цена (€)
            </label>
            <input
              className="input-admin tabular-nums mt-1"
              inputMode="decimal"
              placeholder="25"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
              Минути
            </label>
            <input
              className="input-admin tabular-nums mt-1"
              inputMode="numeric"
              placeholder="60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="w-full rounded-xl py-3 text-xs font-black text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
            style={{ background: loading ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
            disabled={!name || !price || !duration || loading}
            onClick={() => void add()}
          >
            {loading ? "Добавяне…" : "+ Добави услугата"}
          </button>
        </div>
      </div>

      {/* ── Активни ── */}
      <div
        className="rounded-2xl bg-white p-5"
        style={{
          border: "1px solid rgba(201,168,76,0.18)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)",
        }}
      >
        <h2 className="mb-3 text-sm font-black text-[#1A1A1A]">Активни услуги</h2>
        {active.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#1A1A1A]/35">Няма активни услуги.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((s) => (
              <li
                key={s.id}
                className="rounded-xl p-4"
                style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-[#1A1A1A]">{s.name}</div>
                    <div className="mt-0.5 text-xs text-[#1A1A1A]/50">
                      {Number(s.price_eur).toFixed(0)} € · {s.duration_minutes ?? 0} мин
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-[#C9A84C]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A]/70 transition hover:border-[#C9A84C]/50"
                      onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                    >
                      {editingId === s.id ? "Затвори" : "Редактирай"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-[#C9A84C]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A]/50 transition hover:text-red-600"
                      onClick={() => void toggle(s.id, s.is_active)}
                    >
                      Деактивирай
                    </button>
                  </div>
                </div>
                {editingId === s.id && (
                  <ServiceEditInline service={s} onSave={(patch) => void patchService(s.id, patch)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Неактивни ── */}
      {inactive.length > 0 && (
        <div
          className="rounded-2xl bg-white p-5"
          style={{
            border: "1px solid rgba(201,168,76,0.12)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <h2 className="mb-3 text-sm font-black text-[#1A1A1A]/50">Неактивни (скрити от сайта)</h2>
          <ul className="space-y-2">
            {inactive.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
                style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div>
                  <div className="text-sm font-medium text-[#1A1A1A]/60">{s.name}</div>
                  <div className="text-xs text-[#1A1A1A]/40">
                    {Number(s.price_eur).toFixed(0)} € · {s.duration_minutes ?? 0} мин
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-[#C9A84C]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A1A]/60 transition hover:border-[#C9A84C]/50"
                    disabled={deletingId === s.id}
                    onClick={() => void toggle(s.id, s.is_active)}
                  >
                    Активирай
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    disabled={deletingId === s.id}
                    onClick={() => void removeInactive(s.id, s.name)}
                  >
                    {deletingId === s.id ? "…" : "Изтрий"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ServiceEditInline(props: {
  service: Service;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const s = props.service;
  const [name, setName] = useState(s.name);
  const [price, setPrice] = useState(String(s.price_eur));
  const [duration, setDuration] = useState(String(s.duration_minutes ?? 60));

  return (
    <div
      className="mt-4 rounded-xl p-4"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
            Услуга
          </label>
          <input className="input-admin mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
            Цена (€)
          </label>
          <input className="input-admin mt-1" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
            Минути
          </label>
          <input className="input-admin mt-1" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="rounded-xl px-4 py-2 text-xs font-black text-white transition hover:opacity-90"
          style={{ background: `linear-gradient(135deg, #C9A84C, #C8826A)` }}
          onClick={() =>
            props.onSave({
              name: name.trim(),
              price_eur: Number(price),
              duration_minutes: Number(duration),
              is_complex: false,
              active_start_min: null,
              active_start_max: null,
              waiting_min: null,
              waiting_max: null,
              active_finish_min: null,
              active_finish_max: null,
            })
          }
        >
          ✓ Запази промените
        </button>
      </div>
    </div>
  );
}
