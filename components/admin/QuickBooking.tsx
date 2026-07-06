"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { createAdminBooking } from "@/app/actions/admin-booking";
import { AdminTimeSelect } from "@/components/admin/AdminTimeSelect";
import { addCalendarDaysInSofia } from "@/lib/booking-datetime";
import { timeToMinutes } from "@/lib/scheduling";
import type { HairDensity, HairLength, Plan, Service, Specialist, WorkingHours } from "@/types";

type ClientSuggestion = { id: string; name: string; phone: string; email: string };

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
  workingHours: WorkingHours | null;
  bookingWindowDays?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { salonSlug, date, time, services, specialists, plan, workingHours, bookingWindowDays = 30, onClose, onSaved } = props;

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


  const maxBookingDate = useMemo(() => addCalendarDaysInSofia(todayISO, bookingWindowDays), [todayISO, bookingWindowDays]);

  const normalizeTime = (t: string) => t.slice(0, 5);

  const [bookingDate, setBookingDate] = useState(() => {
    const d = date < todayISO ? todayISO : date;
    return d > maxBookingDate ? maxBookingDate : d;
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(() => (time ? normalizeTime(time) : null));
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [specialistId, setSpecialistId] = useState("");
  const [hairLength, setHairLength] = useState<HairLength>("medium");
  const [hairDensity, setHairDensity] = useState<HairDensity>("medium");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justPickedName = useRef(false);
  const justPickedPhone = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  /** Кое поле е "котва" на отворения dropdown — име или телефон. */
  const suggestAnchorRef = useRef<"name" | "phone">("name");
  const [suggestRect, setSuggestRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [freeSlots, setFreeSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [currentWorkingHours, setCurrentWorkingHours] = useState<WorkingHours | null>(workingHours);

  const selected = activeServices.find((s) => s.id === serviceId) ?? null;
  const activeSpecs = useMemo(() => specialists.filter((s) => s.is_active), [specialists]);
  const needSpecialist = plan === "premium" && activeSpecs.length > 1;
  // Used both for slot availability fetching and for the final booking save —
  // previously duplicated (and the slots fetch never included it at all, so
  // premium multi-specialist salons saw salon-wide free slots instead of the
  // selected specialist's actual availability — audit 2026-06-15/16).
  const effectiveSpecialistId = needSpecialist
    ? specialistId || undefined
    : plan === "premium" && activeSpecs.length === 1
      ? activeSpecs[0]!.id
      : undefined;

  useEffect(() => {
    const d = date < todayISO ? todayISO : date;
    setBookingDate(d > maxBookingDate ? maxBookingDate : d);
  }, [date, todayISO, maxBookingDate]);

  // Clear selected time if it becomes past while modal is open
  useEffect(() => {
    if (selectedTime && bookingDate === todayISO && timeToMinutes(selectedTime) <= nowMinutes) {
      setSelectedTime(null);
    }
  }, [nowMinutes, selectedTime, bookingDate, todayISO]);

  const updateSuggestRect = useCallback((field: "name" | "phone") => {
    const el = field === "name" ? nameInputRef.current : phoneInputRef.current;
    if (!el) return;
    suggestAnchorRef.current = field;
    const r = el.getBoundingClientRect();
    setSuggestRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  /** Общ debounced fetch за подсказки — от името или от телефона. */
  const fetchSuggestions = useCallback(
    (query: string, field: "name" | "phone") => {
      if (suggestRef.current) clearTimeout(suggestRef.current);
      setSuggestionsLoading(true);
      suggestRef.current = setTimeout(() => {
        fetch(`/api/admin/clients/search?q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((d: unknown) => {
            const list = Array.isArray(d) ? d : [];
            setSuggestions(list as ClientSuggestion[]);
            setShowSuggestions(list.length > 0);
            if (list.length > 0) updateSuggestRect(field);
          })
          .catch(() => {
            setSuggestions([]);
            setShowSuggestions(false);
          })
          .finally(() => setSuggestionsLoading(false));
      }, 220);
    },
    [updateSuggestRect]
  );

  const clearSuggestionsFor = useCallback((field: "name" | "phone") => {
    if (suggestAnchorRef.current !== field) return;
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionsLoading(false);
  }, []);

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
    if (effectiveSpecialistId) {
      qs.set("specialist_id", effectiveSpecialistId);
    }
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
  }, [bookingDate, serviceId, selected?.is_complex, hairLength, hairDensity, effectiveSpecialistId]);

  // Pre-select clicked slot from calendar when it is still free
  useEffect(() => {
    if (!time || slotsLoading) return;
    const t = normalizeTime(time);
    const isPast = bookingDate === todayISO && timeToMinutes(t) <= nowMinutes;
    if (!isPast && freeSlots.includes(t)) {
      setSelectedTime((prev) => prev ?? t);
    }
  }, [time, freeSlots, slotsLoading, bookingDate, todayISO, nowMinutes]);

  // Drop time if service/date change made it unavailable
  useEffect(() => {
    if (!selectedTime || slotsLoading) return;
    const isPast = bookingDate === todayISO && timeToMinutes(selectedTime) <= nowMinutes;
    if (isPast || !freeSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [freeSlots, slotsLoading, selectedTime, bookingDate, todayISO, nowMinutes]);

  // Подсказки при писане на име
  useEffect(() => {
    if (justPickedName.current) { justPickedName.current = false; return; }
    const q = clientName.trim();
    if (q.length < 1) {
      clearSuggestionsFor("name");
      return;
    }
    fetchSuggestions(q, "name");
    return () => { if (suggestRef.current) clearTimeout(suggestRef.current); };
  }, [clientName, fetchSuggestions, clearSuggestionsFor]);

  // Подсказки при писане на телефон — от ≥3 цифри търси клиент в базата,
  // независимо дали номерът е въведен като 0888… или +359888… (сървърът
  // генерира вариантите).
  useEffect(() => {
    if (justPickedPhone.current) { justPickedPhone.current = false; return; }
    const digits = phone.replace(/\D+/g, "");
    if (digits.length < 3) {
      clearSuggestionsFor("phone");
      return;
    }
    fetchSuggestions(phone.trim(), "phone");
    return () => { if (suggestRef.current) clearTimeout(suggestRef.current); };
  }, [phone, fetchSuggestions, clearSuggestionsFor]);

  function pickSuggestion(s: ClientSuggestion) {
    justPickedName.current = true;
    setClientName(s.name);
    if (s.phone) {
      justPickedPhone.current = true;
      setPhone(s.phone);
    }
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

  const selectableTimes = useMemo(() => {
    if (!currentWorkingHours || currentWorkingHours.is_day_off) return [];
    return freeSlots.filter((slot) => {
      if (bookingDate === todayISO && timeToMinutes(slot) <= nowMinutes) return false;
      return true;
    });
  }, [freeSlots, currentWorkingHours, bookingDate, todayISO, nowMinutes]);

  const timeSelectValue = selectedTime && selectableTimes.includes(selectedTime)
    ? selectedTime
    : "";

  const suggestionPortal =
    showSuggestions && suggestRect && typeof document !== "undefined"
      ? createPortal(
          <ul
            className="overflow-hidden rounded-xl border bg-white shadow-xl"
            style={{
              position: "fixed",
              top: suggestRect.top,
              left: suggestRect.left,
              width: suggestRect.width,
              zIndex: 200,
              borderColor: "rgba(201,168,76,0.25)",
              maxHeight: "min(240px, 40vh)",
              overflowY: "auto",
            }}
            onMouseDown={(e) => e.preventDefault()}
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
          </ul>,
          document.body
        )
      : null;

  async function save() {
    if (!selected) { setError("Изберете услуга."); return; }
    if (!bookingDate) { setError("Изберете дата."); return; }
    if (!selectedTime) { setError("Изберете час."); return; }
    if (!clientName.trim()) { setError("Името на клиента е задължително."); return; }
    if (phone.trim() && phone.trim().length < 5) {
      setError("Телефонът трябва да е поне 5 символа или да остане празен."); return;
    }
    if (needSpecialist && !specialistId) { setError("Изберете специалист."); return; }

    setSaving(true);
    setError(null);
    try {
      // Празен телефон е позволен за админ (walk-in) — сървърът тогава НЕ
      // създава клиентски запис, така че няма фантомни дубликати. Никакви
      // синтетични placeholder-и (старият `anon-uuid` така или иначе падаше
      // на схемата — audit 2026-07-06).
      const result = await createAdminBooking({
        salon_slug: salonSlug,
        specialist_id: effectiveSpecialistId,
        service_id: selected.id,
        booking_date: bookingDate,
        booking_time: selectedTime,
        client_name: clientName.trim(),
        client_phone: phone.trim(),
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

            <div className="space-y-5">
              {/* 1. Кога */}
              <section className="space-y-3 rounded-xl border p-4" style={{ borderColor: "rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.03)" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#C9A84C" }}>1. Кога</p>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Дата *</label>
                  <input
                    type="date"
                    className="input-admin"
                    value={bookingDate}
                    min={todayISO}
                    max={maxBookingDate}
                    onChange={(e) => { setBookingDate(e.target.value); setSelectedTime(null); }}
                    required
                  />
                </div>

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

                {selected?.is_complex ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Дължина</label>
                      <select className="input-admin" value={hairLength} onChange={(e) => { setHairLength(e.target.value as HairLength); setSelectedTime(null); }}>
                        {HAIR_LEN.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Гъстота</label>
                      <select className="input-admin" value={hairDensity} onChange={(e) => { setHairDensity(e.target.value as HairDensity); setSelectedTime(null); }}>
                        {HAIR_DEN.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                      </select>
                    </div>
                  </div>
                ) : null}

                {needSpecialist ? (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Специалист *</label>
                    <select
                      className="input-admin"
                      value={specialistId}
                      onChange={(e) => { setSpecialistId(e.target.value); setSelectedTime(null); }}
                    >
                      <option value="">—</option>
                      {activeSpecs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                ) : null}

                <div>
                  {!currentWorkingHours || currentWorkingHours.is_day_off ? (
                    <p className="rounded-xl border px-3 py-3 text-center text-sm text-[#1A1A1A]/40" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                      Почивен ден — няма работно време.
                    </p>
                  ) : slotsLoading ? (
                    <p className="text-sm text-[#1A1A1A]/45">Проверяване на свободните часове…</p>
                  ) : selectableTimes.length === 0 ? (
                    <p className="rounded-xl border px-3 py-3 text-center text-sm text-[#1A1A1A]/40" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                      Няма свободни часове за тази дата.
                    </p>
                  ) : (
                    <AdminTimeSelect
                      id="quick-booking-time"
                      label="Час *"
                      value={timeSelectValue}
                      placeholder="— Избери час —"
                      options={selectableTimes}
                      onChange={(v) => setSelectedTime(v || null)}
                    />
                  )}
                  {currentWorkingHours && !currentWorkingHours.is_day_off && !slotsLoading && selectableTimes.length > 0 ? (
                    <p className="mt-1.5 text-[10px] text-[#1A1A1A]/30">
                      {currentWorkingHours.start_time} – {currentWorkingHours.end_time} · само свободни часове
                    </p>
                  ) : null}
                </div>
              </section>

              {/* 2. Клиент */}
              <section className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#C9A84C" }}>2. Клиент</p>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Име *</label>
                  <input
                    ref={nameInputRef}
                    className="input-admin"
                    placeholder="Започни да пишеш — ще видиш клиенти от базата"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onFocus={() => {
                      updateSuggestRect("name");
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                    autoComplete="off"
                  />
                  {suggestionsLoading ? (
                    <p className="mt-1 text-[11px] text-[#1A1A1A]/35">Търсене в клиенти…</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Телефон</label>
                    <input
                      ref={phoneInputRef}
                      className="input-admin"
                      placeholder="+359 88... — търси клиент"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => {
                        updateSuggestRect("phone");
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 180);
                        void lookupPhone();
                      }}
                      inputMode="tel"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/40">Имейл</label>
                    <input className="input-admin" type="email" placeholder="mail@..." value={email} onChange={(e) => setEmail(e.target.value)} />
                    {!email.trim() ? (
                      <p className="mt-1 text-[11px] text-amber-700/80">Без имейл клиентът няма да получи потвърждение и напомняне.</p>
                    ) : null}
                  </div>
                </div>
              </section>
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
        {suggestionPortal}
      </div>
    </div>
  );
}
