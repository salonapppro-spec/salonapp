"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createAdminBooking } from "@/app/actions/admin-booking";
import { calculateDuration } from "@/lib/scheduling";
import type { HairDensity, HairLength, Plan, Service, Specialist } from "@/types";

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

export function QuickBooking(props: {
  salonSlug: string;
  date: string;
  time: string;
  services: Service[];
  specialists: Specialist[];
  plan: Plan;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { salonSlug, date, time, services, specialists, plan, onClose, onSaved } = props;

  const activeServices = useMemo(() => services.filter((s) => s.is_active), [services]);

  const [bookingTime, setBookingTime] = useState(time.length > 5 ? time.slice(0, 5) : time);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [specialistId, setSpecialistId] = useState("");
  const [hairLength, setHairLength] = useState<HairLength>("medium");
  const [hairDensity, setHairDensity] = useState<HairDensity>("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = activeServices.find((s) => s.id === serviceId) ?? null;
  const activeSpecs = useMemo(() => specialists.filter((s) => s.is_active), [specialists]);
  const needSpecialist = plan === "collective" && activeSpecs.length > 1;

  const lookupPhone = useCallback(async () => {
    const p = phone.trim();
    if (p.length < 5) return;
    try {
      const qs = new URLSearchParams({ salon_slug: salonSlug, phone: p });
      const res = await fetch(`/api/clients/lookup?${qs.toString()}`);
      const json = (await res.json()) as { name?: string | null; email?: string | null };
      if (!res.ok) return;
      if (json.name && !clientName.trim()) setClientName(json.name);
      if (json.email && !email.trim()) setEmail(json.email);
    } catch {
      // ignore
    }
  }, [phone, salonSlug, clientName, email]);

  useEffect(() => {
    if (activeServices.length && !activeServices.some((s) => s.id === serviceId)) {
      setServiceId(activeServices[0]!.id);
    }
  }, [activeServices, serviceId]);

  async function save() {
    if (!selected) {
      setError("Изберете услуга.");
      return;
    }
    if (!clientName.trim()) {
      setError("Името на клиента е задължително.");
      return;
    }
    if (needSpecialist && !specialistId) {
      setError("Изберете специалист.");
      return;
    }

    const resolvedSpecialistId = needSpecialist
      ? specialistId
      : plan === "collective" && activeSpecs.length === 1
        ? activeSpecs[0]!.id
        : undefined;

    let duration = selected.duration_minutes ?? 0;
    if (selected.is_complex) {
      duration = calculateDuration(selected, hairLength, hairDensity).totalMinutes;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        salon_slug: salonSlug,
        specialist_id: resolvedSpecialistId,
        service_id: selected.id,
        service_name: selected.name,
        service_price_eur: Number(selected.price_eur),
        service_duration: duration,
        booking_date: date,
        booking_time: bookingTime.length > 5 ? bookingTime.slice(0, 5) : bookingTime,
        client_name: clientName.trim(),
        client_phone: phone.trim() || "00000",
        client_email: email.trim() || undefined,
        hair_length: selected.is_complex ? hairLength : undefined,
        hair_density: selected.is_complex ? hairDensity : undefined,
      };

      const result = await createAdminBooking(payload);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Затвори" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl" style={{ border: "1px solid rgba(201,168,76,0.25)" }}>
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl px-5 py-4" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(200,130,106,0.12))" }}>
          <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ background: "linear-gradient(90deg, #C9A84C, #C8826A)" }} />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>✦ Бърз час</h2>
              <p className="mt-0.5 text-xs text-[#1A1A1A]/45">{date}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-[#1A1A1A]/40 transition hover:bg-black/5 hover:text-[#1A1A1A]">✕</button>
          </div>
        </div>

        <div className="p-5">
          {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</div> : null}

          <div className="space-y-3">
            {/* Time picker — prominent */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#C9A84C" }}>Час *</label>
              <input
                type="time"
                className="input-admin text-xl font-black tabular-nums"
                style={{ color: "#C9A84C", fontFamily: "inherit" }}
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                required
              />
            </div>

            <div className="my-1 border-t" style={{ borderColor: "rgba(201,168,76,0.12)" }} />

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
              <label className="text-sm font-medium text-brand-900">Специалист *</label>
              <select
                className="input-admin"
                value={specialistId}
                onChange={(e) => setSpecialistId(e.target.value)}
              >
                <option value="">—</option>
                {activeSpecs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-sm font-medium text-brand-900">Услуга</label>
            <select className="input-admin" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {Number(s.price_eur).toFixed(0)} €
                </option>
              ))}
            </select>
          </div>
          {selected?.is_complex ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-brand-900">Дължина</label>
                <select className="input-admin" value={hairLength} onChange={(e) => setHairLength(e.target.value as HairLength)}>
                  {HAIR_LEN.map((x) => (
                    <option key={x.v} value={x.v}>
                      {x.l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-900">Гъстота</label>
                <select className="input-admin" value={hairDensity} onChange={(e) => setHairDensity(e.target.value as HairDensity)}>
                  {HAIR_DEN.map((x) => (
                    <option key={x.v} value={x.v}>
                      {x.l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
          <div className="mt-5 flex gap-2">
            <button type="button" className="flex-1 rounded-xl border py-3 text-sm font-semibold text-[#1A1A1A]/55 transition hover:bg-black/5" style={{ borderColor: "rgba(201,168,76,0.2)" }} onClick={onClose}>
              Отказ
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              style={{ background: saving ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg, #C9A84C, #C8826A)" }}
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Запазване…" : "✓ Запази"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
