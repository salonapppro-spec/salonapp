"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SalonData, Service, TimeSlot } from "@/types/database";
import { createBooking } from "@/app/actions/booking";
import { isLikelyValidPhone } from "@/lib/phone";

const BGN = 1.956;
const MONTHS_BG = [
  "Януари", "Февруари", "Март", "Април", "Май", "Юни",
  "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември",
];
const DOW_BG = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"] as const; // Monday-first

const WINDOW_DAYS = 45;

function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
/** JS getDay(): 0=Sun..6=Sat → column index Monday-first 0..6 */
function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function priceLabel(s: Service): string {
  const e = Number(s.price_eur);
  return `${e.toFixed(0)} € · ${(e * BGN).toFixed(0)} лв`;
}

export function AtsBooking({ data }: { data: SalonData }) {
  const { tenant, workingHours } = data;
  const salonSlug = tenant.salon_slug;
  const services = useMemo(
    () => data.services.filter((s) => s.is_active),
    [data.services]
  );

  const today = useMemo(() => atMidnight(new Date()), []);
  const maxDate = useMemo(() => addDays(today, WINDOW_DAYS), [today]);

  const dayOffSet = useMemo(() => {
    const set = new Set<number>();
    for (const w of workingHours) if (w.is_day_off) set.add(w.day_of_week);
    return set;
  }, [workingHours]);

  const isSelectable = useCallback(
    (d: Date): boolean => {
      const day = atMidnight(d);
      if (day < today || day > maxDate) return false;
      if (dayOffSet.has(day.getDay())) return false;
      return true;
    },
    [today, maxDate, dayOffSet]
  );

  const firstOpen = useMemo(() => {
    for (let i = 0; i <= WINDOW_DAYS; i++) {
      const d = addDays(today, i);
      if (isSelectable(d)) return d;
    }
    return today;
  }, [today, isSelectable]);

  const [serviceId, setServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(firstOpen);
  const [viewMonth, setViewMonth] = useState<Date>(() => new Date(firstOpen.getFullYear(), firstOpen.getMonth(), 1));

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState("");

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

  // Reset time when the inputs that define availability change.
  useEffect(() => {
    setTime("");
    setSlots([]);
  }, [serviceId, selectedDate]);

  const dateISO = isoOf(selectedDate);

  const loadSlots = useCallback(async () => {
    if (!serviceId) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ salon_slug: salonSlug, date: dateISO, service_id: serviceId });
      const res = await fetch(`/api/availability?${qs.toString()}`);
      const json = (await res.json()) as { slots?: TimeSlot[]; error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Грешка при зареждане на часовете.");
      setSlots((json.slots ?? []).filter((s) => s.available !== false));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при зареждане на часовете.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, salonSlug, dateISO]);

  useEffect(() => {
    if (serviceId) loadSlots();
  }, [serviceId, dateISO, loadSlots]);

  // Calendar grid for the viewed month.
  const grid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lead = mondayIndex(first.getDay());
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const canPrevMonth = useMemo(() => {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    const cur = new Date(today.getFullYear(), today.getMonth(), 1);
    return prev >= cur;
  }, [viewMonth, today]);
  const canNextMonth = useMemo(() => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    const lim = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    return next <= lim;
  }, [viewMonth, maxDate]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const canSubmit =
    !!serviceId && !!time && name.trim().length > 0 && isLikelyValidPhone(phone) && emailValid && !submitting;

  const formRef = useRef<HTMLDivElement>(null);

  async function submit() {
    if (!selectedService) {
      setError("Изберете услуга.");
      return;
    }
    if (!time) {
      setError("Изберете свободен час.");
      return;
    }
    if (!name.trim()) return setError("Въведете вашето име.");
    if (!isLikelyValidPhone(phone)) return setError("Проверете телефонния номер (напр. 0888 123 456).");
    if (!emailValid) return setError("Въведете валиден имейл — на него ще получите потвърждение.");

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
      setError("Възникна грешка. Опитайте отново.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="ab" style={{ textAlign: "center", padding: "clamp(2rem,6vw,4rem)" }}>
        <style>{css}</style>
        <div className="ab-done-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="ab-done-title">Заявката е приета</h3>
        <p className="ab-done-text">
          Изпратихме потвърждение на <strong>{email.trim()}</strong>. Ще получите и напомняне преди часа.
        </p>
        <div className="ab-done-card">
          <div><span>Услуга</span><strong>{selectedService?.name}</strong></div>
          <div><span>Дата</span><strong>{selectedDate.getDate()} {MONTHS_BG[selectedDate.getMonth()].toLowerCase()}</strong></div>
          <div><span>Час</span><strong>{time}</strong></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ab" ref={formRef}>
      <style>{css}</style>

      {/* 1 — Услуга */}
      <div className="ab-block">
        <div className="ab-step-head"><span className="ab-step-n">1</span><h3>Изберете услуга</h3></div>
        <div className="ab-svc-grid">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ab-svc${serviceId === s.id ? " on" : ""}`}
              onClick={() => setServiceId(s.id)}
              aria-pressed={serviceId === s.id}
            >
              <span className="ab-svc-name">{s.name}</span>
              <span className="ab-svc-meta">
                {s.duration_minutes ? `${s.duration_minutes} мин · ` : ""}{priceLabel(s)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2 — Дата и час */}
      <div className="ab-datetime">
        <div className="ab-block">
          <div className="ab-step-head"><span className="ab-step-n">2</span><h3>Дата</h3></div>
          <div className="ab-cal">
            <div className="ab-cal-head">
              <button type="button" className="ab-cal-nav" onClick={() => canPrevMonth && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} disabled={!canPrevMonth} aria-label="Предишен месец">‹</button>
              <span className="ab-cal-title">{MONTHS_BG[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
              <button type="button" className="ab-cal-nav" onClick={() => canNextMonth && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} disabled={!canNextMonth} aria-label="Следващ месец">›</button>
            </div>
            <div className="ab-cal-dow">
              {DOW_BG.map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="ab-cal-grid">
              {grid.map((d, i) => {
                if (!d) return <span key={`e${i}`} className="ab-cal-cell empty" />;
                const selectable = isSelectable(d);
                const isSel = sameDay(d, selectedDate);
                const isToday = sameDay(d, today);
                return (
                  <button
                    key={isoOf(d)}
                    type="button"
                    className={`ab-cal-cell${isSel ? " sel" : ""}${isToday ? " today" : ""}`}
                    disabled={!selectable}
                    onClick={() => { setSelectedDate(d); }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="ab-block">
          <div className="ab-step-head"><span className="ab-step-n">3</span><h3>Час</h3></div>
          <div className="ab-slots">
            {!serviceId && <p className="ab-hint">Първо изберете услуга, за да покажем свободните часове.</p>}
            {serviceId && loadingSlots && <p className="ab-hint">Зареждане…</p>}
            {serviceId && !loadingSlots && slots.length === 0 && (
              <p className="ab-hint">Няма свободни часове за този ден. Изберете друга дата.</p>
            )}
            {serviceId && !loadingSlots && slots.length > 0 && (
              <div className="ab-slot-grid">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    className={`ab-slot${time === s.time ? " on" : ""}`}
                    onClick={() => setTime(s.time)}
                  >
                    {s.time.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 — Данни */}
      <div className="ab-block">
        <div className="ab-step-head"><span className="ab-step-n">4</span><h3>Вашите данни</h3></div>
        <div className="ab-fields">
          <label className="ab-field">
            <span>Име</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Име и фамилия" autoComplete="name" />
          </label>
          <label className="ab-field">
            <span>Телефон</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0888 123 456" inputMode="tel" autoComplete="tel" />
          </label>
          <label className="ab-field">
            <span>Имейл</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" autoComplete="email" />
          </label>
          <label className="ab-field ab-field-wide">
            <span>Бележка <em>(по желание)</em></span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Напр. болки в кръста от седмица" />
          </label>
        </div>
      </div>

      {error && <p className="ab-error" role="alert">{error}</p>}

      <div className="ab-submit-row">
        <div className="ab-summary" aria-hidden={!time}>
          {selectedService && time ? (
            <>
              <strong>{selectedService.name}</strong>
              <span>{selectedDate.getDate()} {MONTHS_BG[selectedDate.getMonth()].toLowerCase()} · {time.slice(0, 5)} ч.</span>
            </>
          ) : (
            <span className="ab-summary-empty">Изберете услуга, дата и час</span>
          )}
        </div>
        <button type="button" className="ab-cta" onClick={submit} disabled={!canSubmit}>
          {submitting ? "Изпращане…" : "Потвърди часа"}
        </button>
      </div>
    </div>
  );
}

const css = `
.ab { --ab-radius: 14px; color: var(--ats-graphite); font-family: var(--f-sans); }
.ab * { box-sizing: border-box; }
.ab-block { margin-bottom: 2rem; }
.ab-step-head { display: flex; align-items: center; gap: .7rem; margin-bottom: 1.1rem; }
.ab-step-n {
  width: 26px; height: 26px; flex: none; border-radius: 50%;
  background: var(--ats-midnight); color: var(--ats-gold-soft);
  font-family: var(--f-serif); font-weight: 700; font-size: .95rem;
  display: inline-flex; align-items: center; justify-content: center;
}
.ab-step-head h3 { font-family: var(--f-serif); font-size: 1.5rem; font-weight: 600; color: var(--ats-midnight); margin: 0; }

/* services */
.ab-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: .7rem; }
.ab-svc {
  text-align: left; cursor: pointer; background: #fff;
  border: 1.5px solid var(--ats-line); border-radius: var(--ab-radius);
  padding: .95rem 1.1rem; display: flex; flex-direction: column; gap: .25rem;
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}
.ab-svc:hover { border-color: var(--ats-gold); transform: translateY(-1px); }
.ab-svc.on { border-color: var(--ats-midnight); box-shadow: inset 0 0 0 1px var(--ats-midnight); }
.ab-svc-name { font-weight: 600; color: var(--ats-midnight); font-size: 1rem; }
.ab-svc-meta { font-size: .82rem; color: #7a7a7a; }

/* date + time row */
.ab-datetime { display: grid; grid-template-columns: minmax(0, 340px) 1fr; gap: 2rem; align-items: start; }

/* calendar */
.ab-cal { background: #fff; border: 1.5px solid var(--ats-line); border-radius: var(--ab-radius); padding: 1.1rem; }
.ab-cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.ab-cal-title { font-family: var(--f-serif); font-size: 1.15rem; font-weight: 600; color: var(--ats-midnight); }
.ab-cal-nav {
  width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--ats-line);
  background: var(--ats-ivory); color: var(--ats-midnight); font-size: 1.3rem; line-height: 1; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; transition: background .15s ease, border-color .15s ease;
}
.ab-cal-nav:hover:not(:disabled) { background: var(--ats-midnight); color: var(--ats-ivory); border-color: var(--ats-midnight); }
.ab-cal-nav:disabled { opacity: .3; cursor: not-allowed; }
.ab-cal-dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 4px; }
.ab-cal-dow span { text-align: center; font-size: .68rem; letter-spacing: .05em; text-transform: uppercase; color: #a6a6a6; font-weight: 600; padding: 4px 0; }
.ab-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.ab-cal-cell {
  aspect-ratio: 1; border: 0; background: transparent; border-radius: 9px; cursor: pointer;
  font-size: .9rem; color: var(--ats-graphite); font-family: var(--f-sans);
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .15s ease, color .15s ease;
}
.ab-cal-cell.empty { pointer-events: none; }
.ab-cal-cell:hover:not(:disabled):not(.sel) { background: var(--ats-ivory); }
.ab-cal-cell:disabled { color: #d0d0d0; cursor: not-allowed; }
.ab-cal-cell.today:not(.sel) { box-shadow: inset 0 0 0 1.5px var(--ats-gold); color: var(--ats-midnight); font-weight: 600; }
.ab-cal-cell.sel { background: var(--ats-midnight); color: #fff; font-weight: 700; }

/* time slots */
.ab-slots { min-height: 120px; }
.ab-hint { font-size: .92rem; color: #8a8a8a; margin: .3rem 0; line-height: 1.6; }
.ab-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr)); gap: .55rem; }
.ab-slot {
  padding: .6rem .3rem; border-radius: 10px; border: 1.5px solid var(--ats-line); background: #fff;
  color: var(--ats-midnight); font-size: .92rem; font-weight: 600; cursor: pointer; font-family: var(--f-sans);
  transition: border-color .15s ease, background .15s ease, color .15s ease;
}
.ab-slot:hover { border-color: var(--ats-gold); }
.ab-slot.on { background: var(--ats-midnight); border-color: var(--ats-midnight); color: #fff; }

/* fields */
.ab-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.ab-field { display: flex; flex-direction: column; gap: .35rem; }
.ab-field-wide { grid-column: 1 / -1; }
.ab-field span { font-size: .78rem; letter-spacing: .04em; color: var(--ats-midnight); font-weight: 600; }
.ab-field span em { color: #a0a0a0; font-style: normal; font-weight: 400; }
.ab-field input {
  padding: .8rem .95rem; border-radius: 11px; border: 1.5px solid var(--ats-line);
  background: #fff; font-size: 1rem; color: var(--ats-graphite); font-family: var(--f-sans); width: 100%;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.ab-field input:focus { outline: none; border-color: var(--ats-midnight); box-shadow: 0 0 0 3px rgba(15,35,67,.08); }
.ab-field input::placeholder { color: #b4b4b4; }

.ab-error { color: #b0243a; font-size: .9rem; background: rgba(176,36,58,.07); border: 1px solid rgba(176,36,58,.2); border-radius: 10px; padding: .7rem .9rem; margin: 0 0 1.2rem; }

/* submit */
.ab-submit-row { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; border-top: 1px solid var(--ats-line); padding-top: 1.5rem; }
.ab-summary { display: flex; flex-direction: column; gap: .15rem; min-height: 1.5rem; }
.ab-summary strong { color: var(--ats-midnight); font-size: 1rem; }
.ab-summary span { font-size: .88rem; color: #6a6a6a; }
.ab-summary-empty { font-size: .9rem; color: #a0a0a0; }
.ab-cta {
  background: var(--ats-gold); color: var(--ats-midnight-deep);
  border: 0; border-radius: 12px; padding: 1rem 2.4rem; font-size: 1rem; font-weight: 700;
  letter-spacing: .01em; cursor: pointer; font-family: var(--f-sans);
  box-shadow: 0 14px 30px -14px rgba(200,164,90,.9); transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
}
.ab-cta:hover:not(:disabled) { transform: translateY(-2px); background: var(--ats-gold-soft); }
.ab-cta:disabled { background: #dcdcdc; color: #9a9a9a; box-shadow: none; cursor: not-allowed; }

/* done */
.ab-done-mark { width: 66px; height: 66px; border-radius: 50%; margin: 0 auto 1.4rem; background: rgba(135,154,131,.16); color: #5f7159; display: inline-flex; align-items: center; justify-content: center; }
.ab-done-title { font-family: var(--f-serif); font-size: 2rem; color: var(--ats-midnight); margin: 0 0 .8rem; }
.ab-done-text { font-size: 1rem; color: #5a5a5a; line-height: 1.7; max-width: 46ch; margin: 0 auto 2rem; }
.ab-done-card { display: inline-flex; flex-direction: column; gap: .7rem; text-align: left; background: var(--ats-ivory); border: 1px solid var(--ats-line); border-radius: 14px; padding: 1.4rem 1.8rem; }
.ab-done-card div { display: flex; justify-content: space-between; gap: 2.5rem; }
.ab-done-card span { color: #8a8a8a; font-size: .9rem; }
.ab-done-card strong { color: var(--ats-midnight); }

@media (max-width: 820px) {
  .ab-datetime { grid-template-columns: 1fr; }
  .ab-fields { grid-template-columns: 1fr; }
  .ab-submit-row { flex-direction: column; align-items: stretch; }
  .ab-cta { width: 100%; }
}
`;
