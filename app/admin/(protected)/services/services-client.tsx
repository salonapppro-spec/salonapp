"use client";

import { useMemo, useState } from "react";

import type { Service } from "@/types";

export function ServicesClient(props: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(props.initialServices);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isComplex, setIsComplex] = useState(false);
  const [duration, setDuration] = useState("60");
  const [asMin, setAsMin] = useState("15");
  const [asMax, setAsMax] = useState("30");
  const [wMin, setWMin] = useState("15");
  const [wMax, setWMax] = useState("30");
  const [afMin, setAfMin] = useState("15");
  const [afMax, setAfMax] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const body: Record<string, unknown> = {
        name: name.trim(),
        price_eur: Number(price),
        is_complex: isComplex,
      };
      if (isComplex) {
        body.active_start_min = Number(asMin);
        body.active_start_max = Number(asMax);
        body.waiting_min = Number(wMin);
        body.waiting_max = Number(wMax);
        body.active_finish_min = Number(afMin);
        body.active_finish_max = Number(afMax);
      } else {
        body.duration_minutes = Number(duration);
      }
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    if (!res.ok) {
      setError(json?.error ?? "Грешка");
      return;
    }
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
    if (!res.ok) {
      setError(json?.error ?? "Грешка");
      return;
    }
    setEditingId(null);
    await refresh();
  }

  async function removeInactive(id: string, label: string) {
    if (
      !window.confirm(
        `Да изтрием изцяло услугата „${label}“? Стари резервации ще останат, но вече няма да сочат тази услуга.`
      )
    ) {
      return;
    }
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
    <div className="mt-8 space-y-8">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">{error}</div>
      ) : null}

      <section className="admin-card">
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">Нова услуга</h2>
        <div className="mt-3 flex items-center gap-3">
          <input id="mode-simple" type="radio" checked={!isComplex} onChange={() => setIsComplex(false)} />
          <label htmlFor="mode-simple" className="text-sm text-brand-900">
            Проста (фиксирани минути)
          </label>
          <input id="mode-complex" type="radio" checked={isComplex} onChange={() => setIsComplex(true)} />
          <label htmlFor="mode-complex" className="text-sm text-brand-900">
            Сложна (фази с мин/макс)
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-brand-900">Име</label>
            <input className="input-admin" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900">Цена (€)</label>
            <input
              className="input-admin tabular-nums"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          {!isComplex ? (
            <div>
              <label className="text-sm font-medium text-brand-900">Минути</label>
              <input className="input-admin tabular-nums" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          ) : (
            <div className="sm:col-span-3" />
          )}
        </div>

        {isComplex ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-brand-800">Активно начало — мин</label>
              <input className="input-admin tabular-nums" inputMode="numeric" value={asMin} onChange={(e) => setAsMin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-brand-800">Активно начало — макс</label>
              <input className="input-admin tabular-nums" inputMode="numeric" value={asMax} onChange={(e) => setAsMax(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-brand-800">Изчакване — мин</label>
              <input className="input-admin tabular-nums" inputMode="numeric" value={wMin} onChange={(e) => setWMin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-brand-800">Изчакване — макс</label>
              <input className="input-admin tabular-nums" inputMode="numeric" value={wMax} onChange={(e) => setWMax(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-brand-800">Финиш — мин</label>
              <input className="input-admin tabular-nums" inputMode="numeric" value={afMin} onChange={(e) => setAfMin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-brand-800">Финиш — макс</label>
              <input className="input-admin tabular-nums" inputMode="numeric" value={afMax} onChange={(e) => setAfMax(e.target.value)} />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="btn-admin-primary mt-5 w-full sm:w-auto sm:px-8"
          disabled={!name || !price || loading || (!isComplex && !duration)}
          onClick={add}
        >
          {loading ? "Добавяне…" : "Добави"}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">Активни</h2>
        <ul className="admin-list mt-3">
          {active.map((s) => (
            <li key={s.id} className="px-5 py-3.5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-brand-900">{s.name}</div>
                  <div className="text-brand-800/85">
                    {Number(s.price_eur).toFixed(0)} € ·{" "}
                    {s.is_complex
                      ? `сложна (${s.active_start_min ?? "?"}–${s.active_start_max ?? "?"} / ${s.waiting_min ?? "?"}–${s.waiting_max ?? "?"} / ${s.active_finish_min ?? "?"}–${s.active_finish_max ?? "?"})`
                      : `${s.duration_minutes ?? 0} мин`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-admin-ghost px-4 text-xs" onClick={() => setEditingId(editingId === s.id ? null : s.id)}>
                    {editingId === s.id ? "Затвори" : "Редактирай"}
                  </button>
                  <button type="button" className="btn-admin-ghost px-4" onClick={() => toggle(s.id, s.is_active)}>
                    Деактивирай
                  </button>
                </div>
              </div>
              {editingId === s.id ? (
                <ServiceEditInline service={s} onSave={(patch) => void patchService(s.id, patch)} />
              ) : null}
            </li>
          ))}
          {active.length === 0 ? <li className="px-5 py-8 text-center text-brand-700/75">Няма активни.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">Неактивни (скрити от сайта)</h2>
        <ul className="admin-list mt-3">
          {inactive.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-brand-900">{s.name}</div>
                <div className="text-brand-800/85">
                  {Number(s.price_eur).toFixed(0)} € · {s.duration_minutes ?? 0} мин
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-admin-ghost"
                  disabled={deletingId === s.id}
                  onClick={() => toggle(s.id, s.is_active)}
                >
                  Активирай
                </button>
                <button
                  type="button"
                  className="btn-admin-ghost text-red-700 hover:bg-red-50"
                  disabled={deletingId === s.id}
                  onClick={() => void removeInactive(s.id, s.name)}
                >
                  {deletingId === s.id ? "…" : "Изтрий"}
                </button>
              </div>
            </li>
          ))}
          {inactive.length === 0 ? <li className="px-5 py-8 text-center text-brand-700/75">Няма.</li> : null}
        </ul>
      </section>
    </div>
  );
}

function ServiceEditInline(props: { service: Service; onSave: (patch: Record<string, unknown>) => void }) {
  const s = props.service;
  const [name, setName] = useState(s.name);
  const [price, setPrice] = useState(String(s.price_eur));
  const [isComplex, setIsComplex] = useState(s.is_complex);
  const [duration, setDuration] = useState(String(s.duration_minutes ?? 60));
  const [asMin, setAsMin] = useState(String(s.active_start_min ?? 15));
  const [asMax, setAsMax] = useState(String(s.active_start_max ?? 30));
  const [wMin, setWMin] = useState(String(s.waiting_min ?? 15));
  const [wMax, setWMax] = useState(String(s.waiting_max ?? 30));
  const [afMin, setAfMin] = useState(String(s.active_finish_min ?? 15));
  const [afMax, setAfMax] = useState(String(s.active_finish_max ?? 30));

  return (
    <div className="mt-4 rounded-xl border border-brand-200/80 bg-brand-50/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-brand-800">Име</label>
          <input className="input-admin" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-brand-800">Цена €</label>
          <input className="input-admin" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input id={`cx-${s.id}`} type="checkbox" checked={isComplex} onChange={(e) => setIsComplex(e.target.checked)} />
          <label htmlFor={`cx-${s.id}`} className="text-sm">
            Сложна услуга
          </label>
        </div>
        {!isComplex ? (
          <div>
            <label className="text-xs font-medium text-brand-800">Минути</label>
            <input className="input-admin" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium text-brand-800">Начало мин/макс</label>
              <div className="flex gap-2">
                <input className="input-admin" value={asMin} onChange={(e) => setAsMin(e.target.value)} />
                <input className="input-admin" value={asMax} onChange={(e) => setAsMax(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-brand-800">Изчакване мин/макс</label>
              <div className="flex gap-2">
                <input className="input-admin" value={wMin} onChange={(e) => setWMin(e.target.value)} />
                <input className="input-admin" value={wMax} onChange={(e) => setWMax(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-brand-800">Финиш мин/макс</label>
              <div className="flex gap-2">
                <input className="input-admin" value={afMin} onChange={(e) => setAfMin(e.target.value)} />
                <input className="input-admin" value={afMax} onChange={(e) => setAfMax(e.target.value)} />
              </div>
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        className="btn-admin-primary mt-4 w-full sm:w-auto"
        onClick={() => {
          const patch: Record<string, unknown> = {
            name: name.trim(),
            price_eur: Number(price),
            is_complex: isComplex,
          };
          if (isComplex) {
            patch.duration_minutes = null;
            patch.active_start_min = Number(asMin);
            patch.active_start_max = Number(asMax);
            patch.waiting_min = Number(wMin);
            patch.waiting_max = Number(wMax);
            patch.active_finish_min = Number(afMin);
            patch.active_finish_max = Number(afMax);
          } else {
            patch.duration_minutes = Number(duration);
            patch.active_start_min = null;
            patch.active_start_max = null;
            patch.waiting_min = null;
            patch.waiting_max = null;
            patch.active_finish_min = null;
            patch.active_finish_max = null;
          }
          props.onSave(patch);
        }}
      >
        Запази промените
      </button>
    </div>
  );
}
