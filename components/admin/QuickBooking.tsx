"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createAdminBooking } from "@/app/actions/admin-booking";
import { minutesToTime, timeToMinutes } from "@/lib/scheduling";
import type { HairDensity, HairLength, Plan, Service, Specialist, WorkingHours } from "@/types";

const HAIR_LEN: { v: HairLength; l: string }[] = [
  { v: "short", l: "Къса" },
  { v: "medium", l: "Средна" },
  { v: "long", l: "Дълга" },
];
const HAIR_DEN: { v: HairDensity; l: string }[] = [
  { v: "thin", l: "Тънка" },
  { v: "medium", l: "Средна" },
  { v: "thick", l: "Гъста" },
];


function buildAllSlots(wh: WorkingHours): string[] {
  if (wh.is_day_off) return [];
  const slots: string[] = [];
  let t = timeToMinutes(wh.start_time);
  const end = timeToMinutes(wh.end_time);
  while (t < end) { slots.push(minutesToTime(t)); t += 15; }
  return slots;
}

export function QuickBooking(props: {
  salonSlug: string;
  date: string;
  time: string;
  services: Service[];
  specialists: Specialist[];
  plan: Plan;
  workingHours: WorkingHours | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { salonSlug, date, time, services, specialists, plan, workingHours, onClose, onSaved } = props;

  const activeServices = useMemo(() => services.filter((s) => s.is_active), [services]);

  const todayISO = useMemo(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const getNowMinutes = () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
    return now.getHours() * 60 + now.getMinutes();
  };
  const [nowMinutes, setNowMinutes] = useState(getNowMinutes);
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(getNowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);


  const [bookingDate, setBookingDate] = useState(() => date < todayISO ? todayISO : date);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [specialistId, setSpecialistId] = useState("");
  const [hairLength, setHairLength] = useState<HairLength>("medium");
  const [hairDensity, setHairDensity] = useState<HairDensity>("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; phone: string; email: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justPicked = useRef(false);
  const [freeSlots, setFreeSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [currentWorkingHours, setCurrentWorkingHours] = useState<WorkingHours | null>(workingHours);

  const selected = activeServices.find((s) => s.id === serviceId) ?? null;
  const activeSpecs = useMemo(() => specialists.filter((s) => s.is_active), [specialists]);
  const needSpecialist = plan === "premium" && activeSpecs.length > 1;

  const allSlots = useMemo(
    () => (currentWorkingHours ? buildAllSlots(currentWorkingHours) : []),
    [currentWorkingHours]
  );

  useEffect(() => {
    setBookingDate(date < todayISO ? todayISO : date);
  }, [date, todayISO]);

  // Clear selected time if it becomes past while modal is open
  useEffect(() => {
    if (selectedTime && bookingDate === todayISO && timeToMinutes(selectedTime) <= nowMinutes) {
      setSelectedTime(null);
    }
  }, [nowMinutes, selectedTime, bookingDate, todayISO]);

  const prevTimeRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevTimeRef.current !== null && prevTimeRef.current !== time) {
      setSelectedTime(null);
    }
    prevTimeRef.current = time;
  }, [time]);

  // Re-fetch working hours when the date changes inside the modal
  useEffect(() => {
    if (!bookingDate) return;
    const dayOfWeek = new Date(`${bookingDate}T00:00:00`).getDay();
    fetch("/api/admin/working-hours")
      .then((r) => r.json())
      .then((d: { days?: { start_time: string; end_time: string; is_day_off: boolean }[] }) => {
        const entry = d.days?.[dayOfWeek];
        if (!entry) return;
        // Construct a minimal WorkingHours-compatible object
        setCurrentWorkingHours({
          ...entry,
          day_of_week: dayOfWeek,
          id: `fetched-${dayOfWeek}`,
          salon_slug: salonSlug,
          specialist_id: null,
        } as WorkingHours);
      })
      .catch(() => { /* keep current */ });
  }, [bookingDate, salonSlug]);

  useEffect(() => {
    if (activeServices.length && !activeServices.some((s) => s.id === serviceId)) {
      setServiceId(activeServices[0]!.id);
    }
  }, [activeServices, serviceId]);

  // Fetch free slots whenever date / service / hair options change
  useEffect(() => {
    if (!bookingDate || !serviceId) { setFreeSlots([]); setSlotsLoading(false); return; }
    setSlotsLoading(true);
    const qs = new URLSearchParams({ service_id: serviceId, date: bookingDate });
    if (selected?.is_complex) {
      qs.set("hair_length", hairLength);
      qs.set("hair_density", hairDensity);
    }
    fetch(`/api/admin/slots?${qs.toString()}`)
      .then((r) => r.json())
      .then((d: { slots?: { time: string }[] }) => {
        setFreeSlots((d.slots ?? []).map((s) => s.time));
      })
      .catch(() => setFreeSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [bookingDate, serviceId, salonSlug, selected?.is_complex, hairLength, hairDensity]);

  useEffect(() => {
    if (justPicked.current) { justPicked.current = false; return; }
    if (suggestRef.current) clearTimeout(suggestRef.current);
    const q = clientName.trim();
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestRef.current = setTimeout(() => {
      fetch(`/api/admin/clients/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { id: string; name: string; phone: string; email: string }[]) => {
          setSuggestions(d);
          setShowSuggestions(d.length > 0);
        })
        .catch(() => { /* ignore */ });
    }, 280);
    return () => { if (suggestRef.current) clearTimeout(suggestRef.current); };
  }, [clientName]);

  function pickSuggestion(s: { name: string; phone: string; email: string }) {
    justPicked.current = true;
    setClientName(s.name);
    if (s.phone) setPhone(s.phone);
    if (s.email) setEmail(s.email);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  const lookupPhone = useCallback(async () => {
    const p = phone.trim();
    if (p.length < 5) return;
    try {
      const qs = new URLSearchParams({ phone: p });
      const res = await fetch(`/api/admin/clients/lookup?${qs.toString()}`);
      const json = (await res.json()) as { name?: string | null; email?: string | null };
      if (!res.ok) return;
      if (json.name && !clientName.trim()) setClientName(json.name);
      if (json.email && !email.trim()) setEmail(json.email);
    } catch { /* ignore */ }
  }, [phone, clientName, email]);

  async function save() {
    if (!selected) { setError("Изберете услуга."); return; }
    if (!bookingDate) { setError("Изберете дата."); return; }
    if (!selectedTime) { setError("Изберете час."); return; }
    if (!clientName.trim()) { setError("Името на клиента е задължително."); return; }
    if (phone.trim() && phone.trim().length < 5) {
      setError("Телефонът трябва да е поне 5 символа или да остане празен."); return;
    }
    if (needSpecialist && !specialistId) { setError("Изберете специалист."); return; }

    const resolvedSpecialistId = needSpecialist
      ? specialistId
      : plan === "premium" && activeSpecs.length === 1
        ? activeSpecs[0]!.id
        : undefined;

    setSaving(true);
    setError(null);
    try {
      const normalizedPhone = phone.trim().length >= 5 ? phone.trim() : "00000";
      const result = await createAdminBooking({
        salon_slug: salonSlug,
        specialist_id: resolvedSpecialistId,
        service_id: selected.id,
        booking_date: bookingDate,
        booking_time: selectedTime,
        client_name: clientName.trim(),
        client_phone: normalizedPhone,
        client_email: email.trim() || undefined,
        hair_length: selected.is_complex ? hairLength : undefined,
        hair_density: selected.is_complex ? hairDensity : undefined,
      });
      if ("error" in result) { setError(result.error); return; }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal
    >
      {/* backdrop — click to close */}
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Затвори" onClick={() => { if (!saving) onClose(); }} />
      {/* drawer panel — bottom sheet on mobile, right drawer on desktop */}
      <div
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-full sm:rounded-none sm:rounded-l-2xl"
        style={{ border: "1px solid rgba(201,168,76,0.2)" }}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden rounded-t-2xl px-5 py-4" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(200,130,106,0.12))" }}>
          <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>✦ Бърз час</h2>
              <p className="mt-0.5 text-xs text-[#1A1A1A]/45">{bookingDate}</p>
            </div>
            <button type="button" disabled={saving} onClick={onClose} className="rounded-xl p-2 text-[#1A1A1A]/40 transition hover:bg-black/5 hover:text-[#1A1A1A] disabled:opacity-50">✕</button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 pb-3">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</div>
            ) : null}

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#C9A84C" }}>Дата *</label>
                <input
                  type="date"
                  className="input-admin"
                  value={bookingDate}
                  min={todayISO}
                  onChange={(e) => { setBookingDate(e.target.value); setSelectedTime(null); }}
                  required
                />
              </div>

              {/* Service — shown before slots so slot fetch uses the right duration */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Услуга</label>
                <select
                  className="input-admin"
                  value={serviceId}
                  onChange={(e) => { setServiceId(e.target.value); setSelectedTime(null); }}
                >
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {Number(s.price_eur).toFixed(0)} €
                    </option>
                  ))}
                </select>
              </div>

              {/* Hair options for complex services */}
              {selected?.is_complex ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Дължина</label>
                    <select className="input-admin" value={hairLength} onChange={(e) => setHairLength(e.target.value as HairLength)}>
                      {HAIR_LEN.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Гъстота</label>
                    <select className="input-admin" value={hairDensity} onChange={(e) => setHairDensity(e.target.value as HairDensity)}>
                      {HAIR_DEN.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                    </select>
                  </div>
                </div>
              ) : null}

              {/* Time slot grid */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#C9A84C" }}>Час *</label>
                  {selectedTime && (
                    <span className="text-xs font-black tabular-nums" style={{ color: "#C9A84C" }}>{selectedTime}</span>
                  )}
                </div>

                {!currentWorkingHours || currentWorkingHours.is_day_off ? (
                  <p className="rounded-xl border px-3 py-4 text-center text-sm text-[#1A1A1A]/40" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                    Почивен ден — няма работно време.
                  </p>
                ) : allSlots.length === 0 ? (
                  <p className="rounded-xl border px-3 py-4 text-center text-sm text-[#1A1A1A]/40" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                    Няма зададено работно време.
                  </p>
                ) : (
                  <div
                    className="rounded-xl border p-2"
                    style={{ borderColor: "rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.02)", opacity: slotsLoading ? 0.5 : 1, transition: "opacity 0.15s" }}
                  >
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                      {allSlots.map((slot) => {
                        const isPast = bookingDate === todayISO && timeToMinutes(slot) <= nowMinutes;
                        const isFree = !slotsLoading && freeSlots.includes(slot) && !isPast;
                        const isSelected = slot === selectedTime;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={slotsLoading || !isFree}
                            onClick={() => setSelectedTime(slot)}
                            className="rounded-lg py-2 text-xs font-semibold tabular-nums transition"
                            style={
                              isSelected
                                ? { background: "linear-gradient(135deg, #C9A84C, #C8826A)", color: "#fff", border: "1.5px solid transparent" }
                                : slotsLoading
                                  ? { background: "transparent", color: "rgba(26,26,26,0.35)", border: "1.5px solid rgba(26,26,26,0.1)", cursor: "default" }
                                  : isFree
                                    ? { background: "transparent", color: "#1A1A1A", border: "1.5px solid rgba(201,168,76,0.35)", cursor: "pointer" }
                                    : { background: "transparent", color: "rgba(26,26,26,0.2)", border: "1.5px solid rgba(26,26,26,0.07)", cursor: "not-allowed", textDecoration: "line-through" }
                            }
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-center text-[10px] text-[#1A1A1A]/30">
                      {slotsLoading
                        ? "Проверяване на свободните часове…"
                        : `${currentWorkingHours!.start_time} – ${currentWorkingHours!.end_time} · зачеркнатите са заети`}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t" style={{ borderColor: "rgba(201,168,76,0.12)" }} />

              {/* Client info */}
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Клиент *</label>
                <input
                  className="input-admin"
                  placeholder="Име на клиента"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul
                    className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-white shadow-xl"
                    style={{ borderColor: "rgba(201,168,76,0.25)" }}
                  >
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-[rgba(201,168,76,0.07)] active:bg-[rgba(201,168,76,0.12)]"
                          onMouseDown={() => pickSuggestion(s)}
                        >
                          <span className="text-sm font-semibold text-[#1A1A1A]">{s.name}</span>
                          {(s.phone || s.email) && (
                            <span className="text-[11px] text-[#1A1A1A]/45">
                              {[s.phone, s.email].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Телефон</label>
                  <input
                    className="input-admin"
                    placeholder="+359 88..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => void lookupPhone()}
                    inputMode="tel"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Имейл</label>
                  <input className="input-admin" type="email" placeholder="mail@..." value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {needSpecialist ? (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Специалист *</label>
                  <select className="input-admin" value={specialistId} onChange={(e) => setSpecialistId(e.target.value)}>
                    <option value="">—</option>
                    {activeSpecs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className="shrink-0 border-t bg-white p-4"
            style={{ borderColor: "rgba(201,168,76,0.2)", boxShadow: "0 -4px 18px rgba(0,0,0,0.06)" }}
          >
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border py-3 text-sm font-semibold text-[#1A1A1A]/55 transition hover:bg-black/5 disabled:opacity-50"
                style={{ borderColor: "rgba(201,168,76,0.2)" }}
                onClick={onClose}
                disabled={saving}
              >
                Отказ
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ background: saving ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg, #C9A84C, #C8826A)" }}
                disabled={saving || !selectedTime}
              >
                {saving ? "Запазване…" : "✓ Запази"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
