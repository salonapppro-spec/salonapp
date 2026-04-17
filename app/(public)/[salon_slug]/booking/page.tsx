"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { HairDensity, HairLength, Service } from "@/types";
import { CreateBookingSchema } from "@/schemas/booking";

type Slot = { time: string; type: "magnetic" | "available" | "unavailable" };

function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingPage() {
  const router = useRouter();
  const params = useParams<{ salon_slug: string }>();
  const salonSlug = params?.salon_slug;

  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const selectedService = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);

  const [hairLength, setHairLength] = useState<HairLength | "">("");
  const [hairDensity, setHairDensity] = useState<HairDensity | "">("");

  const [date, setDate] = useState<string>(() => formatDateInput(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState<string>("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!salonSlug) return;
    setLoadingServices(true);
    setError(null);
    fetch(`/api/services?salon_slug=${encodeURIComponent(salonSlug)}`)
      .then((r) => r.json())
      .then((json) => setServices(json.services ?? []))
      .catch(() => setError("Не успяхме да заредим услугите."))
      .finally(() => setLoadingServices(false));
  }, [salonSlug]);

  useEffect(() => {
    setTime("");
    setSlots([]);
  }, [serviceId, date, hairLength, hairDensity]);

  async function loadSlots() {
    if (!salonSlug || !selectedService) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        salon_slug: salonSlug,
        date,
        service_id: selectedService.id,
      });
      if (selectedService.is_complex) {
        if (hairLength) qs.set("hair_length", hairLength);
        if (hairDensity) qs.set("hair_density", hairDensity);
      }
      const res = await fetch(`/api/bookings?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Грешка при зареждане на слотовете.");
      setSlots(json.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при зареждане на слотовете.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function submit() {
    if (!salonSlug || !selectedService) return;
    setSubmitting(true);
    setError(null);
    setOkMessage(null);

    const payload = {
      salon_slug: salonSlug,
      service_id: selectedService.id,
      service_name: selectedService.name,
      service_price_eur: Number(selectedService.price_eur),
      service_duration: selectedService.duration_minutes ?? 0,
      booking_date: date,
      booking_time: time,
      client_name: name,
      client_phone: phone || undefined,
      client_email: email || undefined,
      notes: notes || undefined,
      hair_length: selectedService.is_complex && hairLength ? hairLength : undefined,
      hair_density: selectedService.is_complex && hairDensity ? hairDensity : undefined,
    };

    const parsed = CreateBookingSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Моля, попълни всички задължителни полета.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно записване.");
      setOkMessage("Часът е запазен! Ще получиш потвърждение по имейл (ако е въведен).");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неуспешно записване.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!salonSlug) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold">Запази час</h1>
      <p className="mt-1 text-sm text-neutral-600">Бърз онлайн запис за {salonSlug}.</p>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
      {okMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{okMessage}</div>
      ) : null}

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Услуга</label>
          <select
            className="mt-2 w-full rounded-lg border px-3 py-2"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={loadingServices}
          >
            <option value="">{loadingServices ? "Зареждане..." : "Избери услуга"}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {Number(s.price_eur).toFixed(0)}€
              </option>
            ))}
          </select>
        </div>

        {selectedService?.is_complex ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Дължина</label>
              <select
                className="mt-2 w-full rounded-lg border px-3 py-2"
                value={hairLength}
                onChange={(e) => setHairLength(e.target.value as HairLength | "")}
              >
                <option value="">Избери</option>
                <option value="къса">къса</option>
                <option value="средна">средна</option>
                <option value="дълга">дълга</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Гъстота</label>
              <select
                className="mt-2 w-full rounded-lg border px-3 py-2"
                value={hairDensity}
                onChange={(e) => setHairDensity(e.target.value as HairDensity | "")}
              >
                <option value="">Избери</option>
                <option value="рядка">рядка</option>
                <option value="средна">средна</option>
                <option value="гъста">гъста</option>
              </select>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Дата</label>
            <input className="mt-2 w-full rounded-lg border px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              onClick={loadSlots}
              disabled={!selectedService || (selectedService.is_complex && (!hairLength || !hairDensity)) || loadingSlots}
            >
              {loadingSlots ? "Зареждане..." : "Покажи часове"}
            </button>
          </div>
        </div>

        {slots.length > 0 ? (
          <div>
            <label className="text-sm font-medium">Час</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {slots.map((s) => {
                const disabled = s.type === "unavailable";
                const isSelected = time === s.time;
                const base =
                  s.type === "magnetic" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-neutral-200 bg-white text-neutral-900";
                return (
                  <button
                    key={s.time}
                    type="button"
                    className={`rounded-lg border px-2 py-2 text-xs ${base} ${isSelected ? "ring-2 ring-neutral-900" : ""} ${
                      disabled ? "cursor-not-allowed opacity-40" : ""
                    }`}
                    onClick={() => setTime(s.time)}
                    disabled={disabled}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-neutral-600">
              Зелено = препоръчан (магнитен) слот, бяло = наличен, сиво = недостъпен.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Име</label>
            <input className="mt-2 w-full rounded-lg border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Телефон</label>
            <input className="mt-2 w-full rounded-lg border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Имейл</label>
            <input className="mt-2 w-full rounded-lg border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Бележка</label>
            <textarea className="mt-2 w-full rounded-lg border px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <button
          type="button"
          className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          onClick={submit}
          disabled={!selectedService || !time || !name || submitting}
        >
          {submitting ? "Записване..." : "Потвърди резервация"}
        </button>
      </div>
    </div>
  );
}

