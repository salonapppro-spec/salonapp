"use client";

import { useCallback, useEffect, useState } from "react";

import type { Booking, Client } from "@/types";

type DetailJson = {
  client: Client;
  bookings: Booking[];
  stats: {
    /** null когато ролята няма finances_write (audit 2026-06-16) */
    totalRevenue: number | null;
    bookingCount: number;
    completedCount: number;
    noShowCount: number;
    topServices: { name: string; count: number }[];
  };
};

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

function statusBg(status: string) {
  switch (status) {
    case "pending": return { bg: "rgba(251,191,36,0.12)", color: "#78350f", label: "Изчаква" };
    case "confirmed": return { bg: "rgba(96,165,250,0.12)", color: "#1e3a5f", label: "Потвърден" };
    case "completed": return { bg: "rgba(52,211,153,0.12)", color: "#064e3b", label: "Яви се" };
    case "no_show": return { bg: "rgba(248,113,113,0.12)", color: "#7f1d1d", label: "Не се яви" };
    default: return { bg: "rgba(209,213,219,0.2)", color: "#6b7280", label: "Отказан" };
  }
}

export function ClientsAdminClient(props: { initialClients: Client[]; searchQ: string }) {
  const { initialClients, searchQ } = props;
  const [clients, setClients] = useState(initialClients);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefetchCache = useState<Map<string, DetailJson>>(() => new Map())[0];

  // Edit fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // New client modal
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addOk, setAddOk] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchDetail = useCallback(async (id: string): Promise<DetailJson> => {
    if (prefetchCache.has(id)) return prefetchCache.get(id)!;
    const res = await fetch(`/api/admin/clients/${id}`);
    const json = (await res.json()) as DetailJson & { error?: string };
    if (!res.ok) throw new Error(json?.error ?? "Грешка");
    prefetchCache.set(id, json);
    return json;
  }, [prefetchCache]);

  const prefetchDetail = useCallback((id: string) => {
    if (!prefetchCache.has(id)) void fetchDetail(id).catch(() => {});
  }, [fetchDetail, prefetchCache]);

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchDetail(id);
      setDetail(json);
      setName(json.client.name);
      setPhone(json.client.phone ?? "");
      setEmail(json.client.email ?? "");
      setNotes(json.client.notes ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [fetchDetail]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  async function saveProfile() {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || null, notes: notes.trim() || null }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      prefetchCache.delete(selectedId);
      await loadDetail(selectedId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setSaving(false);
    }
  }

  async function gdprDelete() {
    if (!selectedId) return;
    if (!confirm("Анонимизиране на резервациите и изтриване на клиента (GDPR)?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${selectedId}`, { method: "DELETE" });
      prefetchCache.delete(selectedId);
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      setSelectedId(null);
      setClients((c) => c.filter((x) => x.id !== selectedId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setSaving(false);
    }
  }

  async function addClient() {
    const trimmedName = newName.trim();
    const trimmedPhone = newPhone.trim();
    const trimmedEmail = newEmail.trim();
    if (!trimmedName || !trimmedPhone) {
      setAddError("Името и телефонът са задължителни.");
      return;
    }
    setAdding(true);
    setAddError(null);
    setAddOk(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: trimmedPhone, email: trimmedEmail || null }),
      });
      const json = (await res.json()) as { client?: Client; error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка");
      if (json.client) {
        setClients((c) => [json.client!, ...c]);
        setSelectedId(json.client.id);
      }
      setAddOpen(false);
      setNewName(""); setNewPhone(""); setNewEmail("");
      setAddOk("✓ Клиентът е добавен успешно.");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      {/* Add client modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setAddOpen(false)} />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-0 shadow-2xl"
            style={{ border: "1px solid rgba(201,168,76,0.25)" }}
          >
            {/* Modal header */}
            <div className="relative overflow-hidden rounded-t-2xl px-5 py-4" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(200,130,106,0.1))" }}>
              <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${GOLD}, ${ROSE})` }} />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#1A1A1A]">Нов клиент</h2>
                <button type="button" onClick={() => setAddOpen(false)} className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]">✕</button>
              </div>
            </div>
            <div className="space-y-3 p-5">
              {addError && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-900 border border-red-200">{addError}</div>}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Име *</label>
                <input className="input-admin" placeholder="Мария Иванова" value={newName} onChange={(e) => setNewName(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Телефон *</label>
                <input className="input-admin" placeholder="+359 88..." value={newPhone} onChange={(e) => setNewPhone(e.target.value)} inputMode="tel" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Имейл</label>
                <input className="input-admin" type="email" placeholder="mail@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" className="flex-1 rounded-xl border py-3 text-sm font-semibold text-[#1A1A1A]/55 hover:bg-black/5" style={{ borderColor: "rgba(201,168,76,0.2)" }} onClick={() => setAddOpen(false)}>
                  Отказ
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl py-3 text-sm font-black text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
                  disabled={adding || !newName.trim() || !newPhone.trim()}
                  onClick={() => void addClient()}
                >
                  {adding ? "Добавяне…" : "✓ Добави"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addOk && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {addOk}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        {/* Left: list */}
        <div>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-[#1A1A1A]/40">
              {clients.length} {clients.length === 1 ? "клиент" : "клиента"}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
              <a
                href="/api/admin/clients/export"
                className="rounded-xl border px-3 py-2.5 text-center text-xs font-bold text-[#1A1A1A]/50 transition hover:text-[#1A1A1A] sm:py-1.5 sm:text-[11px]"
                style={{ borderColor: "rgba(201,168,76,0.2)", background: "white" }}
                download
              >
                ⬇ CSV
              </a>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="rounded-xl px-3 py-2.5 text-center text-xs font-black text-white transition hover:opacity-90 sm:py-1.5 sm:text-[11px]"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              >
                + Добави клиент
              </button>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-2xl bg-white"
            style={{ border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <ul className="max-h-[72vh] overflow-y-auto">
              {clients.map((c) => (
                <li key={c.id} style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className="w-full px-6 py-3.5 text-left transition"
                    style={selectedId === c.id ? { background: "rgba(201,168,76,0.08)" } : {}}
                    onMouseEnter={(e) => { prefetchDetail(c.id); if (selectedId !== c.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.04)"; }}
                    onMouseLeave={(e) => { if (selectedId !== c.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                        style={{ background: selectedId === c.id ? `linear-gradient(135deg, ${GOLD}, ${ROSE})` : "rgba(201,168,76,0.2)", color: selectedId === c.id ? "white" : GOLD }}
                      >
                        {c.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#1A1A1A]">{c.name}</div>
                        <div className="truncate text-xs text-[#1A1A1A]/45">{[c.phone, c.email].filter(Boolean).join(" · ") || "—"}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {clients.length === 0 && (
                <li className="px-4 py-12 text-center">
                  <div className="text-3xl mb-2">👤</div>
                  <p className="text-sm font-semibold text-[#1A1A1A]/40">{searchQ ? "Няма резултати." : "Няма клиенти."}</p>
                  {!searchQ && <p className="mt-1 text-xs text-[#1A1A1A]/30">Клиентите се добавят при резервация или ръчно с бутона горе.</p>}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right: detail — на мобилно празният placeholder е скрит, показва се само при избран клиент */}
        <div
          className={`rounded-2xl bg-white ${selectedId ? "block" : "hidden lg:block"}`}
          style={{ border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)", minHeight: "320px" }}
        >
          {!selectedId ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
              <div className="text-4xl">👈</div>
              <p className="text-sm font-semibold text-[#1A1A1A]/40 text-center">Избери клиент от списъка вляво</p>
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center p-8">
              <p className="text-sm text-[#1A1A1A]/40">Зареждане…</p>
            </div>
          ) : error ? (
            <div className="p-5 text-sm text-red-700">{error}</div>
          ) : detail ? (
            <div>
              {/* Client header */}
              <div className="relative overflow-hidden rounded-t-2xl px-5 py-4" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(200,130,106,0.08))", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
                  >
                    {detail.client.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#1A1A1A]">{detail.client.name}</h2>
                    <p className="text-xs text-[#1A1A1A]/45">{[detail.client.phone, detail.client.email].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Прогнозна стойност", value: detail.stats.totalRevenue === null ? "—" : `${detail.stats.totalRevenue.toFixed(0)} €`, color: GOLD },
                    { label: "Резервации", value: String(detail.stats.bookingCount), color: ROSE },
                    { label: "Явили се", value: String(detail.stats.completedCount), color: "#34d399" },
                    { label: "No-show", value: String(detail.stats.noShowCount), color: "#f87171" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.1)" }}>
                      <div className="text-[9px] font-black uppercase tracking-wider text-[#1A1A1A]/40">{s.label}</div>
                      <div className="mt-0.5 text-lg font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Edit form */}
                <div className="space-y-3 border-t pt-4" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: GOLD }}>Контакти и бележки</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1A1A1A]/40">Име</label>
                      <input className="input-admin" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1A1A1A]/40">Телефон</label>
                      <input className="input-admin" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1A1A1A]/40">Имейл</label>
                      <input className="input-admin" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1A1A1A]/40">Бележки</label>
                      <textarea className="textarea-admin min-h-[4rem]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="VIP клиент, алергии, предпочитания…" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-xl py-2.5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
                    disabled={saving}
                    onClick={() => void saveProfile()}
                  >
                    {saving ? "Запазване…" : "✓ Запази профил"}
                  </button>
                </div>

                {/* History */}
                <div className="border-t pt-4" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: GOLD }}>История</p>
                  <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                    {detail.bookings.map((b) => {
                      const s = statusBg(b.status);
                      return (
                        <li key={b.id} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs" style={{ background: s.bg, border: `1px solid ${s.bg}` }}>
                          <span className="font-black tabular-nums shrink-0" style={{ color: s.color }}>{b.booking_date} {b.booking_time.slice(0, 5)}</span>
                          <span className="truncate text-[#1A1A1A]/60">{b.service_name}</span>
                          <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 font-semibold" style={{ color: s.color, background: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                        </li>
                      );
                    })}
                    {detail.bookings.length === 0 && <li className="text-[#1A1A1A]/30 text-center py-3">Няма история</li>}
                  </ul>
                </div>

                {/* GDPR */}
                <div className="border-t pt-3" style={{ borderColor: "rgba(201,168,76,0.1)" }}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    disabled={saving}
                    onClick={() => void gdprDelete()}
                  >
                    🗑 Изтрий (GDPR анонимизация)
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
