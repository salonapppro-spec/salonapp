"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

function snapTo15(raw: string): string {
  const parts = raw.split(":");
  let h = parseInt(parts[0] ?? "9", 10);
  let mi = parseInt((parts[1] ?? "0").replace(/\D.*/, ""), 10);
  if (!Number.isFinite(h)) h = 9;
  if (!Number.isFinite(mi)) mi = 0;
  let snapped = Math.round(mi / 15) * 15;
  if (snapped === 60) { h = Math.min(23, h + 1); snapped = 0; }
  return `${String(Math.max(0, Math.min(23, h))).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

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

  const [bookingDate, setBookingDate] = useState(() => date < todayISO ? todayISO : date);
  const [selectedTime, setSelectedTime] = useState<string | null>(() => snapTo15(time));
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [specialistId, setSpecialistId] = useState("");
  const [hairLength, setHairLength] = useState<HairLength>("medium");
  const [hairDensity, setHairDensity] = useState<HairDensity>("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    setSelectedTime(snapTo15(time));
  }, [time]);

  // Re-fetch working hours when the date changes inside the modal
  useEffect(() => {
    if (!bookingDate) return;
    const dayOfWeek = new Date(`${bookingDate}T00:00:00`).getDay();
    fetch("/api/admin/working-hours")
      .then((r) => r.json())
      .then((d: { days?: WorkingHours[] }) => {
        const wh = (d.days ?? []).find((x) => x.day_of_week === dayOfWeek) ?? null;
        setCurrentWorkingHours(wh);
      })
      .catch(() => { /* keep current */ });
  }, [bookingDate]);

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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Затвори" onClick={() => { if (!saving) onClose(); }} />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-0 shadow-2xl"
        style={{ border: "1px solid rgba(201,168,76,0.25)" }}
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

        <form onSubmit={(e) => { e.preventDefault(); void save(); }}>
          <div className="max-h-[min(70vh,560px)] overflow-y-auto overflow-x-hidden p-5 pb-3">
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
                        const isFree = !slotsLoading && freeSlots.includes(slot);
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
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Клиент *</label>
                <input className="input-admin" placeholder="Име на клиента" value={clientName} onChange={(e) => setClientName(e.target.value)} autoComplete="name" />
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
