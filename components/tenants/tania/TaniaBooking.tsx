"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { SalonData, Service, TimeSlot } from "@/types/database";
import { createBooking } from "@/app/actions/booking";
import { isLikelyValidPhone } from "@/lib/phone";
import { bgnLabel, durationLabel, eurLabel, groupServices } from "./data";

const WINDOW_DAYS = 45;
const MONTHS_BG = [
  "януари", "февруари", "март", "април", "май", "юни",
  "юли", "август", "септември", "октомври", "ноември", "декември",
];
const DOW_SHORT = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"];

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function sameDay(a: Date, b: Date): boolean {
  return isoOf(a) === isoOf(b);
}

/**
 * Едностъпкова форма: услуга, дата, час и данни са в един панел,
 * бутонът „Резервирай“ стои най-долу и е винаги видим на екрана.
 */
export function TaniaBooking({ data }: { data: SalonData }) {
  const salonSlug = data.tenant.salon_slug;
  const groups = useMemo(() => groupServices(data.services), [data.services]);
  const services = useMemo<Service[]>(() => groups.flatMap((g) => g.items), [groups]);

  const today = useMemo(() => atMidnight(new Date()), []);

  const dayOffSet = useMemo(() => {
    const set = new Set<number>();
    for (const w of data.workingHours) if (w.is_day_off) set.add(w.day_of_week);
    return set;
  }, [data.workingHours]);

  /** Лентата с дати показва само работните дни напред — без празни клетки. */
  const openDays = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i <= WINDOW_DAYS; i++) {
      const d = addDays(today, i);
      if (!dayOffSet.has(d.getDay())) out.push(d);
    }
    return out;
  }, [today, dayOffSet]);

  const [serviceId, setServiceId] = useState("");
  const [dateISO, setDateISO] = useState(() => (openDays[0] ? isoOf(openDays[0]) : isoOf(today)));
  const [time, setTime] = useState("");

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );
  const selectedDate = useMemo(() => new Date(`${dateISO}T00:00:00`), [dateISO]);

  useEffect(() => {
    setTime("");
    setSlots([]);
  }, [serviceId, dateISO]);

  const loadSlots = useCallback(async () => {
    if (!serviceId) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ salon_slug: salonSlug, date: dateISO, service_id: serviceId });
      const res = await fetch(`/api/availability?${qs.toString()}`);
      const json = (await res.json()) as { slots?: TimeSlot[] };
      // Съобщението от API-то е служебно (на английски) — на клиента показваме нашето.
      if (!res.ok) throw new Error("availability request failed");
      setSlots((json.slots ?? []).filter((s) => s.available !== false));
    } catch {
      setError("Не успяхме да заредим свободните часове. Опитайте отново след малко.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, salonSlug, dateISO]);

  useEffect(() => {
    if (serviceId) loadSlots();
  }, [serviceId, dateISO, loadSlots]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const canSubmit =
    !!serviceId && !!time && name.trim().length > 0 && isLikelyValidPhone(phone) && emailValid && !submitting;

  async function submit() {
    if (!selectedService) return setError("Изберете услуга.");
    if (!time) return setError("Изберете свободен час.");
    if (!name.trim()) return setError("Въведете вашето име.");
    if (!isLikelyValidPhone(phone)) return setError("Проверете телефонния номер (напр. 0888 123 456).");
    if (!emailValid) return setError("Въведете валиден имейл — на него ще получите потвърждението.");

    setSubmitting(true);
    setError(null);
    try {
      const res = await createBooking({
        salon_slug: salonSlug,
        service_id: selectedService.id,
        booking_date: dateISO,
        booking_time: time,
        client_name: name.trim(),
        client_phone: phone.trim(),
        client_email: email.trim(),
        notes: notes.trim() || undefined,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Възникна грешка. Опитайте отново или се обадете в салона.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="tb tb-done">
        <style>{BOOKING_CSS}</style>
        <span className="tb-done-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3>Часът е заявен</h3>
        <p>
          Изпратихме потвърждение на <strong>{email.trim()}</strong>. Ще получите и напомняне преди самия час.
        </p>
        <dl className="tb-done-card">
          <div><dt>Услуга</dt><dd>{selectedService?.name}</dd></div>
          <div><dt>Дата</dt><dd>{selectedDate.getDate()} {MONTHS_BG[selectedDate.getMonth()]}</dd></div>
          <div><dt>Час</dt><dd>{time.slice(0, 5)}</dd></div>
        </dl>
      </div>
    );
  }

  return (
    <div className="tb">
      <style>{BOOKING_CSS}</style>

      {/* Услуга */}
      <div className="tb-row">
        <label className="tb-lab" htmlFor="tb-service">Услуга</label>
        <div className="tb-select-wrap">
          <select
            id="tb-service"
            className="tb-select"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">— изберете услуга —</option>
            {groups.map((g) => (
              <optgroup key={g.title} label={g.title}>
                {g.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {eurLabel(s)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="tb-select-arrow" aria-hidden="true">▾</span>
        </div>
        {selectedService && (
          <p className="tb-svc-meta">
            {[durationLabel(selectedService.duration_minutes), `${eurLabel(selectedService)} · ${bgnLabel(selectedService)}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      {/* Дата */}
      <div className="tb-row">
        <span className="tb-lab">Дата</span>
        <div className="tb-dates" role="group" aria-label="Изберете дата">
          {openDays.map((d) => {
            const iso = isoOf(d);
            const on = iso === dateISO;
            return (
              <button
                key={iso}
                type="button"
                className={`tb-date${on ? " on" : ""}`}
                aria-pressed={on}
                onClick={() => setDateISO(iso)}
              >
                <span className="tb-date-dow">{sameDay(d, today) ? "днес" : DOW_SHORT[d.getDay()]}</span>
                <span className="tb-date-num">{d.getDate()}</span>
                <span className="tb-date-mon">{MONTHS_BG[d.getMonth()].slice(0, 3)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Час */}
      <div className="tb-row">
        <span className="tb-lab">Свободен час</span>
        <div className="tb-slots">
          {!serviceId && <p className="tb-hint">Изберете услуга и ще покажем свободните часове за деня.</p>}
          {serviceId && loadingSlots && <p className="tb-hint">Зареждаме свободните часове…</p>}
          {serviceId && !loadingSlots && slots.length === 0 && !error && (
            <p className="tb-hint">За този ден няма свободни часове. Опитайте с друга дата.</p>
          )}
          {serviceId && !loadingSlots && slots.length > 0 && (
            <div className="tb-slot-grid">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  className={`tb-slot${time === s.time ? " on" : ""}`}
                  aria-pressed={time === s.time}
                  onClick={() => setTime(s.time)}
                >
                  {s.time.slice(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Данни */}
      <div className="tb-row tb-fields">
        <label className="tb-field">
          <span className="tb-lab">Име</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Име и фамилия" autoComplete="name" />
        </label>
        <label className="tb-field">
          <span className="tb-lab">Телефон</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0888 123 456" inputMode="tel" autoComplete="tel" />
        </label>
        <label className="tb-field">
          <span className="tb-lab">Имейл</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@email.com" inputMode="email" autoComplete="email" />
        </label>
        <label className="tb-field">
          <span className="tb-lab">Бележка <em>(по желание)</em></span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Напр. дълга коса, гъста" />
        </label>
      </div>

      {error && <p className="tb-error" role="alert">{error}</p>}

      <div className="tb-foot">
        <p className="tb-summary">
          {selectedService && time ? (
            <>
              <strong>{selectedService.name}</strong>
              <span>{selectedDate.getDate()} {MONTHS_BG[selectedDate.getMonth()]} · {time.slice(0, 5)} ч.</span>
            </>
          ) : (
            <span className="tb-summary-empty">Изберете услуга, дата и час</span>
          )}
        </p>
        <button type="button" className="tb-cta" onClick={submit} disabled={!canSubmit}>
          {submitting ? "Изпращаме…" : "Резервирай"}
        </button>
      </div>
    </div>
  );
}

const BOOKING_CSS = `
.tb { font-family: var(--t-body); color: var(--t-ink); }
.tb * { box-sizing: border-box; }
.tb-row { margin-bottom: 1.6rem; }
.tb-lab {
  display: block; font-size: .74rem; font-weight: 700; letter-spacing: .16em;
  text-transform: uppercase; color: var(--t-gold-deep); margin-bottom: .6rem;
}
.tb-lab em { font-style: normal; font-weight: 500; letter-spacing: .04em; text-transform: none; color: var(--t-ink); opacity: .5; }

/* услуга */
.tb-select-wrap { position: relative; }
.tb-select {
  width: 100%; appearance: none; -webkit-appearance: none;
  font-family: var(--t-body); font-size: 1rem; color: var(--t-ink);
  background: #fff; border: 1.5px solid var(--t-line); border-radius: 4px;
  padding: .95rem 2.6rem .95rem 1rem; min-height: 52px; cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.tb-select:focus { outline: none; border-color: var(--t-gold); box-shadow: 0 0 0 3px rgba(185,134,60,.16); }
.tb-select-arrow { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: var(--t-gold-deep); pointer-events: none; font-size: .9rem; }
.tb-svc-meta { margin: .6rem 0 0; font-size: .9rem; color: var(--t-cocoa); opacity: .75; }

/* дати */
.tb-dates {
  display: flex; gap: .5rem; max-width: 100%; overflow-x: auto; padding-bottom: .5rem;
  scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch;
}
.tb-dates::-webkit-scrollbar { height: 4px; }
.tb-dates::-webkit-scrollbar-thumb { background: var(--t-champagne); border-radius: 4px; }
.tb-date {
  flex: 0 0 auto; scroll-snap-align: start; cursor: pointer;
  width: 58px; min-height: 72px; padding: .5rem .25rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .1rem;
  background: #fff; border: 1.5px solid var(--t-line); border-radius: 4px;
  font-family: var(--t-body); color: var(--t-ink);
  transition: border-color .18s ease, background .18s ease, color .18s ease;
}
.tb-date:hover { border-color: var(--t-gold); }
.tb-date.on { background: var(--t-cocoa); border-color: var(--t-cocoa); color: var(--t-cream); }
.tb-date.on .tb-date-dow, .tb-date.on .tb-date-mon { color: var(--t-champagne); }
.tb-date-dow { font-size: .66rem; letter-spacing: .1em; text-transform: uppercase; color: var(--t-gold-deep); font-weight: 700; }
.tb-date-num { font-family: var(--t-display); font-size: 1.3rem; line-height: 1.1; }
.tb-date-mon { font-size: .66rem; letter-spacing: .06em; opacity: .7; }

/* часове */
.tb-slots { min-height: 56px; }
.tb-hint { margin: 0; font-size: .95rem; line-height: 1.6; color: var(--t-cocoa); opacity: .72; }
.tb-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: .5rem; }
.tb-slot {
  min-height: 46px; padding: .6rem .4rem; cursor: pointer;
  background: #fff; border: 1.5px solid var(--t-line); border-radius: 4px;
  font-family: var(--t-body); font-size: 1rem; font-weight: 600; color: var(--t-ink);
  transition: border-color .18s ease, background .18s ease, color .18s ease;
}
.tb-slot:hover { border-color: var(--t-gold); }
.tb-slot.on { background: var(--t-gold); border-color: var(--t-gold); color: #fff; }

/* данни */
.tb-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.2rem; }
.tb-field { display: block; }
.tb-field input {
  width: 100%; min-height: 52px; padding: .9rem 1rem;
  font-family: var(--t-body); font-size: 1rem; color: var(--t-ink);
  background: #fff; border: 1.5px solid var(--t-line); border-radius: 4px;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.tb-field input:focus { outline: none; border-color: var(--t-gold); box-shadow: 0 0 0 3px rgba(185,134,60,.16); }
.tb-field input::placeholder { color: rgba(59,42,29,.36); }

.tb-error {
  margin: 0 0 1.2rem; padding: .8rem 1rem; border-radius: 4px;
  background: rgba(158,42,42,.07); border: 1px solid rgba(158,42,42,.26);
  color: #8d2323; font-size: .93rem; line-height: 1.5;
}

/* подвал */
.tb-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 1.4rem; flex-wrap: wrap;
  border-top: 1px solid var(--t-line); padding-top: 1.4rem;
}
.tb-summary { margin: 0; display: flex; flex-direction: column; gap: .15rem; }
.tb-summary strong { font-family: var(--t-display); font-size: 1.1rem; font-weight: 400; }
.tb-summary span { font-size: .9rem; color: var(--t-cocoa); opacity: .78; }
.tb-summary-empty { font-size: .95rem; color: var(--t-cocoa); opacity: .6; }
.tb-cta {
  min-height: 54px; padding: 1rem 2.8rem; cursor: pointer; border: 0; border-radius: 4px;
  font-family: var(--t-body); font-size: 1rem; font-weight: 700; letter-spacing: .04em;
  color: #fff; background: linear-gradient(120deg, var(--t-gold-deep), var(--t-gold) 55%, #D6A75A);
  box-shadow: 0 12px 26px -14px rgba(150,104,42,.9);
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
}
.tb-cta:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
.tb-cta:disabled { background: #DCD3C6; color: #8e8375; box-shadow: none; cursor: not-allowed; }

/* потвърждение */
.tb-done { text-align: center; padding: 1rem 0 .5rem; }
.tb-done-mark {
  width: 62px; height: 62px; border-radius: 50%; margin: 0 auto 1.3rem;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(185,134,60,.14); color: var(--t-gold-deep);
}
.tb-done h3 { font-family: var(--t-display); font-weight: 400; font-size: clamp(1.7rem, 4vw, 2.3rem); margin: 0 0 .7rem; }
.tb-done > p { margin: 0 auto 1.8rem; max-width: 44ch; line-height: 1.7; color: var(--t-cocoa); }
.tb-done-card {
  display: inline-flex; flex-direction: column; gap: .7rem; margin: 0; text-align: left;
  background: var(--t-sand); border: 1px solid var(--t-line); border-radius: 4px; padding: 1.3rem 1.7rem;
}
.tb-done-card div { display: flex; justify-content: space-between; gap: 2.4rem; }
.tb-done-card dt { font-size: .88rem; color: var(--t-cocoa); opacity: .7; }
.tb-done-card dd { margin: 0; font-weight: 600; }

@media (max-width: 720px) {
  .tb-fields { grid-template-columns: 1fr; }
  .tb-foot { flex-direction: column; align-items: stretch; }
  .tb-cta { width: 100%; }
  .tb-summary { text-align: center; }
}
`;
