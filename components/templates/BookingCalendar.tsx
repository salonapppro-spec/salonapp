"use client";

import { useState, useEffect } from "react";
import type { Service, WorkingHours } from "@/types/database";

interface TimeSlot { time: string; magnetic: boolean; endTime?: string; }

const DEMO_SLOTS: TimeSlot[] = [
  { time: "09:00", magnetic: true },  { time: "09:30", magnetic: false },
  { time: "10:00", magnetic: true },  { time: "10:30", magnetic: false },
  { time: "11:00", magnetic: true },  { time: "11:30", magnetic: false },
  { time: "13:00", magnetic: true },  { time: "14:00", magnetic: false },
  { time: "15:00", magnetic: true },  { time: "15:30", magnetic: false },
  { time: "16:00", magnetic: false }, { time: "16:30", magnetic: false },
];

const BG_MONTHS = [
  "Януари","Февруари","Март","Април","Май","Юни",
  "Юли","Август","Септември","Октомври","Ноември","Декември",
];
const BG_DAYS_SHORT = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function todayStr() {
  const n = new Date();
  return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
}

function isValidPhone(p: string): boolean {
  return /^[+0-9()[\]\s\-]{7,20}$/.test(p.trim());
}

function nowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

interface Props {
  salonSlug: string;
  services: Service[];
  workingHours: WorkingHours[];
  initialSpecialistId?: string | null;
  isDemo?: boolean;
}

export function BookingCalendar({
  salonSlug, services, workingHours, initialSpecialistId, isDemo = false,
}: Props) {
  const active = services.filter((s) => s.is_active);
  const [serviceId, setServiceId] = useState(active[0]?.id ?? "");
  const [curYear, setCurYear] = useState(() => new Date().getFullYear());
  const [curMonth, setCurMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Map day_of_week → is_day_off (0=Sun … 6=Sat)
  const workingDays = new Set(workingHours.filter((wh) => !wh.is_day_off).map((wh) => wh.day_of_week));

  const today = todayStr();

  // Fetch slots when date/service change
  useEffect(() => {
    setSelectedTime(null);
    if (!selectedDate || !serviceId) { setSlots([]); return; }
    if (isDemo) { setSlots(DEMO_SLOTS); return; }
    setSlotsLoading(true);
    fetch(`/api/bookings?salon_slug=${encodeURIComponent(salonSlug)}&service_id=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(selectedDate)}`)
      .then((r) => r.json())
      .then((d: { slots?: TimeSlot[] }) => {
        let fetched = d.slots ?? [];
        if (selectedDate === today) {
          const cutoff = nowMinutes() + 30;
          fetched = fetched.filter((s) => {
            const parts = s.time.split(":");
            return (Number(parts[0] ?? 0)) * 60 + Number(parts[1] ?? 0) > cutoff;
          });
        }
        setSlots(fetched);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, serviceId, salonSlug, isDemo]);

  async function handleSubmit() {
    if (!selectedDate || !selectedTime || !serviceId || !name.trim() || !isValidPhone(phone) || !email.trim()) return;
    setSubmitStatus("loading");
    setErrorMsg("");
    if (isDemo) {
      await new Promise((r) => setTimeout(r, 900));
      setSubmitStatus("success");
      return;
    }
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_slug: salonSlug,
          service_id: serviceId,
          booking_date: selectedDate,
          booking_time: selectedTime,
          client_name: name.trim(),
          client_phone: phone.trim(),
          client_email: email.trim(),
          specialist_id: initialSpecialistId ?? undefined,
        }),
      });
      if (res.ok) { setSubmitStatus("success"); }
      else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(j.error ?? "Грешка. Опитайте пак.");
        setSubmitStatus("error");
      }
    } catch {
      setErrorMsg("Проблем с връзката.");
      setSubmitStatus("error");
    }
  }

  // Calendar grid (week starts Monday)
  function buildCells() {
    const first = new Date(curYear, curMonth, 1);
    let startDow = first.getDay(); // 0=Sun
    if (startDow === 0) startDow = 7;
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const cells: Array<{ dateStr: string; d: number } | null> = [];
    for (let i = 1; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ dateStr: toDateStr(curYear, curMonth, d), d });
    }
    return cells;
  }

  function prevMonth() {
    if (curMonth === 0) { setCurMonth(11); setCurYear((y) => y - 1); }
    else setCurMonth((m) => m - 1);
  }
  function nextMonth() {
    if (curMonth === 11) { setCurMonth(0); setCurYear((y) => y + 1); }
    else setCurMonth((m) => m + 1);
  }

  const canGoPrev = !(curYear === new Date().getFullYear() && curMonth <= new Date().getMonth());
  const cells = buildCells();
  const canSubmit = !!(selectedDate && selectedTime && serviceId && name.trim() && isValidPhone(phone) && email.trim()) && submitStatus !== "loading";

  if (submitStatus === "success") {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>✓</div>
        <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)", marginBottom: "10px", fontFamily: "var(--font-heading)" }}>
          Часът е запазен!
        </h3>
        <p style={{ fontSize: "16px", color: "var(--color-text)", opacity: 0.62, lineHeight: 1.7, fontFamily: "var(--font-body)" }}>
          Ще получите потвърждение на имейл или SMS.<br />
          Напомняне ще бъде изпратено преди часа.
        </p>
      </div>
    );
  }

  const selectedServiceName = active.find((s) => s.id === serviceId)?.name ?? "";
  const formVars = {
    "--ibf-primary": "var(--color-primary)",
    "--ibf-text": "var(--color-text)",
    "--ibf-bg": "var(--color-bg)",
  } as React.CSSProperties;

  return (
    <>
      <style>{`
        /* ── BookingCalendar ── */
        .bcal-root {
          width: 100%;
        }
        .bcal-service-row {
          margin-bottom: 24px;
        }
        .bcal-label {
          display: block;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--color-primary); margin-bottom: 8px;
          font-family: var(--font-nav);
        }
        .bcal-service-select {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
          border-radius: var(--border-radius, 10px);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 15px; font-family: var(--font-body);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
          cursor: pointer;
        }
        .bcal-service-select:focus { outline: none; border-color: var(--color-primary); }

        /* Body: calendar + slots side by side on desktop */
        .bcal-body {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 720px) {
          .bcal-body { grid-template-columns: 1.1fr 1fr; gap: 32px; }
        }

        /* Calendar */
        .bcal-calendar {
          background: color-mix(in srgb, var(--color-primary) 4%, var(--color-bg));
          border: 1px solid color-mix(in srgb, var(--color-primary) 16%, transparent);
          border-radius: var(--border-radius, 14px);
          padding: 20px;
        }
        .bcal-month-nav {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .bcal-month-name {
          font-size: 16px; font-weight: 700;
          color: var(--color-text); font-family: var(--font-heading);
        }
        .bcal-nav-btn {
          background: none; border: none; cursor: pointer;
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--color-text); font-size: 16px;
          transition: background 0.15s;
        }
        .bcal-nav-btn:hover:not(:disabled) {
          background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        }
        .bcal-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
        .bcal-day-headers {
          display: grid; grid-template-columns: repeat(7, 1fr);
          margin-bottom: 6px;
        }
        .bcal-day-header {
          text-align: center; font-size: 11px; font-weight: 700;
          color: var(--color-text); opacity: 0.38;
          font-family: var(--font-nav); padding: 4px 0;
          letter-spacing: 0.05em;
        }
        .bcal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        .bcal-cell-empty { aspect-ratio: 1; }
        .bcal-cell {
          aspect-ratio: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          border-radius: 8px;
          font-size: 14px; font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer; border: none;
          background: transparent;
          color: var(--color-text);
          position: relative;
          transition: background 0.15s, color 0.15s;
          gap: 2px;
        }
        .bcal-cell.available:hover {
          background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        }
        .bcal-cell.today {
          font-weight: 700;
          color: var(--color-primary);
        }
        .bcal-cell.today::after {
          content: '';
          position: absolute; bottom: 4px; left: 50%;
          transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--color-primary);
        }
        .bcal-cell.selected {
          background: var(--color-primary) !important;
          color: #fff !important;
        }
        .bcal-cell.selected::after { background: rgba(255,255,255,0.6) !important; }
        .bcal-cell.disabled {
          opacity: 0.25; cursor: not-allowed;
        }
        .bcal-cell.dayoff { opacity: 0.18; cursor: not-allowed; }
        .bcal-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--color-primary); opacity: 0.55;
          flex-shrink: 0;
        }
        .bcal-cell.selected .bcal-dot { background: #fff; opacity: 0.7; }

        /* Slots panel */
        .bcal-slots-panel {
          display: flex; flex-direction: column; gap: 0;
        }
        .bcal-slots-hint {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center;
          padding: 32px 16px; opacity: 0.4;
          color: var(--color-text); font-family: var(--font-body);
          font-size: 14px; gap: 10px; height: 100%;
          min-height: 200px;
        }
        .bcal-slots-hint svg { opacity: 0.5; }
        .bcal-slots-date {
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--color-primary); margin-bottom: 14px;
          font-family: var(--font-nav);
        }
        .bcal-slots-loading {
          padding: 24px 0; font-size: 14px;
          color: var(--color-text); opacity: 0.5;
          font-family: var(--font-body);
          display: flex; align-items: center; gap: 8px;
        }
        .bcal-slots-empty {
          padding: 20px 0; font-size: 14px;
          color: var(--color-text); opacity: 0.5;
          font-family: var(--font-body);
        }
        .bcal-slots-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 8px; margin-bottom: 20px;
        }
        @media (min-width: 400px) { .bcal-slots-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 720px) { .bcal-slots-grid { grid-template-columns: repeat(3, 1fr); } }
        .bcal-slot-btn {
          padding: 10px 6px;
          border-radius: var(--border-radius, 8px);
          border: 1.5px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
          background: transparent;
          color: var(--color-text);
          font-size: 14px; font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer; text-align: center;
          transition: all 0.15s;
          display: flex; flex-direction: column; align-items: center; gap: 1px;
        }
        .bcal-slot-btn:hover {
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          border-color: var(--color-primary);
        }
        .bcal-slot-btn.selected {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #fff;
        }
        .bcal-slot-btn.magnetic {
          font-weight: 700;
          border-color: color-mix(in srgb, var(--color-primary) 55%, transparent);
        }
        .bcal-slot-star {
          font-size: 9px; opacity: 0.6;
        }
        .bcal-divider {
          height: 1px;
          background: color-mix(in srgb, var(--color-primary) 14%, transparent);
          margin: 4px 0 20px;
        }

        /* Booking form */
        .bcal-form { display: flex; flex-direction: column; gap: 12px; }
        .bcal-form-header {
          font-size: 13px; font-weight: 700;
          color: var(--color-primary); font-family: var(--font-nav);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 4px;
        }
        .bcal-form-summary {
          font-size: 14px; color: var(--color-text);
          font-family: var(--font-body); opacity: 0.72;
          padding: 10px 14px;
          background: color-mix(in srgb, var(--color-primary) 7%, transparent);
          border-radius: var(--border-radius, 8px);
          margin-bottom: 4px;
        }
        .bcal-input {
          width: 100%; padding: 12px 14px; box-sizing: border-box;
          border: 1.5px solid color-mix(in srgb, var(--color-primary) 28%, transparent);
          border-radius: var(--border-radius, 8px);
          background: var(--color-bg); color: var(--color-text);
          font-size: 15px; font-family: var(--font-body);
          outline: none; transition: border-color 0.15s;
        }
        .bcal-input:focus { border-color: var(--color-primary); }
        .bcal-input::placeholder { opacity: 0.4; }
        .bcal-submit {
          width: 100%; padding: 15px;
          background: var(--color-primary); color: #fff;
          border: none; border-radius: var(--border-radius, 10px);
          font-size: 15px; font-weight: 700; font-family: var(--font-button);
          letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer; transition: opacity 0.18s;
          margin-top: 4px;
        }
        .bcal-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        .bcal-submit:hover:not(:disabled) { opacity: 0.88; }
        .bcal-error {
          font-size: 13px; color: #e53e3e;
          text-align: center; font-family: var(--font-body);
        }
        .bcal-footnote {
          font-size: 11px; text-align: center;
          color: var(--color-text); opacity: 0.35;
          font-family: var(--font-body); margin-top: 4px;
        }
      `}</style>

      <div className="bcal-root">
        {/* Service selector */}
        <div className="bcal-service-row">
          <label className="bcal-label">Услуга</label>
          <select
            className="bcal-service-select"
            value={serviceId}
            onChange={(e) => { setServiceId(e.target.value); setSelectedDate(null); setSelectedTime(null); }}
          >
            {active.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.price_eur ? ` — ${Number(s.price_eur).toFixed(0)} €` : ""}
                {!s.is_complex && s.duration_minutes ? ` · ${s.duration_minutes} мин` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="bcal-body">
          {/* ── Calendar ── */}
          <div className="bcal-calendar">
            {/* Month navigation */}
            <div className="bcal-month-nav">
              <button className="bcal-nav-btn" onClick={prevMonth} disabled={!canGoPrev} aria-label="Предишен месец">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="7,1 1,7 7,13" /></svg>
              </button>
              <span className="bcal-month-name">{BG_MONTHS[curMonth]} {curYear}</span>
              <button className="bcal-nav-btn" onClick={nextMonth} aria-label="Следващ месец">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1,1 7,7 1,13" /></svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="bcal-day-headers">
              {BG_DAYS_SHORT.map((d) => <div key={d} className="bcal-day-header">{d}</div>)}
            </div>

            {/* Days grid */}
            <div className="bcal-grid">
              {cells.map((cell, i) => {
                if (!cell) return <div key={`e-${i}`} className="bcal-cell-empty" />;
                const isPast = cell.dateStr < today;
                // day_of_week: getDay() returns 0=Sun. Convert to 0=Mon JS local
                const jsDate = new Date(`${cell.dateStr}T12:00:00`);
                const dow = jsDate.getDay(); // 0=Sun,1=Mon,...6=Sat
                const isWorking = workingDays.has(dow as 0|1|2|3|4|5|6);
                const isOff = !isWorking;
                const isDisabled = isPast || isOff;
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === today;

                let cls = "bcal-cell";
                if (isSelected) cls += " selected";
                else if (isToday) cls += " today";
                if (isDisabled) cls += isOff ? " dayoff" : " disabled";
                else cls += " available";

                return (
                  <button
                    key={cell.dateStr}
                    className={cls}
                    onClick={() => { if (!isDisabled) { setSelectedDate(cell.dateStr); setSelectedTime(null); } }}
                    disabled={isDisabled}
                    aria-label={cell.dateStr}
                  >
                    {cell.d}
                    {!isDisabled && <span className="bcal-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Slots panel ── */}
          <div className="bcal-slots-panel">
            {!selectedDate ? (
              <div className="bcal-slots-hint">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Изберете дата от календара
              </div>
            ) : (
              <>
                <p className="bcal-slots-date">
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" })}
                </p>

                {slotsLoading ? (
                  <div className="bcal-slots-loading">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                    Зареждане на часове…
                  </div>
                ) : slots.length === 0 ? (
                  <p className="bcal-slots-empty">Няма свободни часове за тази дата.<br />Опитайте друга дата.</p>
                ) : (
                  <div className="bcal-slots-grid">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`bcal-slot-btn${selectedTime === slot.time ? " selected" : ""}${slot.magnetic ? " magnetic" : ""}`}
                        onClick={() => setSelectedTime(slot.time === selectedTime ? null : slot.time)}
                      >
                        {slot.time}
                        {slot.magnetic && <span className="bcal-slot-star">★</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Booking form — appears after time selected */}
                {selectedTime && (
                  <>
                    <div className="bcal-divider" />
                    <div className="bcal-form" style={formVars}>
                      <p className="bcal-form-header">Данни за резервация</p>
                      <div className="bcal-form-summary">
                        {selectedServiceName} · {selectedDate && new Date(`${selectedDate}T12:00:00`).toLocaleDateString("bg-BG", { day: "numeric", month: "long" })} в {selectedTime}
                      </div>
                      <input
                        className="bcal-input"
                        type="text"
                        placeholder="Вашето име *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <input
                        className="bcal-input"
                        type="tel"
                        placeholder="Телефон *"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <input
                        className="bcal-input"
                        type="email"
                        placeholder="Имейл *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {submitStatus === "error" && <p className="bcal-error">{errorMsg}</p>}
                      <button className="bcal-submit" onClick={handleSubmit} disabled={!canSubmit}>
                        {submitStatus === "loading" ? "Изпращане…" : "Потвърди резервацията"}
                      </button>
                      <p className="bcal-footnote">✦ Потвърждение по имейл · Напомняне преди часа</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
