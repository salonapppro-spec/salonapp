"use client";

import { useState, useEffect } from "react";
import type { Service, WorkingHours } from "@/types/database";
import { isLikelyValidPhone } from "@/lib/phone";
import { suggestEmailFix } from "@/lib/email-typo";
import { createBooking } from "@/app/actions/booking";

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
  return isLikelyValidPhone(p);
}

function nowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

interface BookingResult {
  serviceName: string;
  date: string;
  time: string;
  durationMin: number;
}

interface Props {
  salonSlug: string;
  salonName: string;
  salonPhone?: string | null;
  salonAddress?: string | null;
  salonGoogleMapsEmbed?: string | null;
  services: Service[];
  workingHours: WorkingHours[];
  initialSpecialistId?: string | null;
  isDemo?: boolean;
}

function toICalDateTime(dateStr: string, timeStr: string): string {
  return dateStr.replace(/-/g, "") + "T" + timeStr.replace(":", "") + "00";
}

function addMinutes(dateStr: string, timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + mins;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  const endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  return toICalDateTime(dateStr, endTime);
}

function googleCalUrl(result: BookingResult, salonName: string, address: string): string {
  const start = toICalDateTime(result.date, result.time);
  const end = addMinutes(result.date, result.time, result.durationMin);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${result.serviceName} @ ${salonName}`,
    dates: `${start}/${end}`,
    location: address,
    details: `Резервация в ${salonName}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function appleCalUrl(result: BookingResult, salonName: string, address: string): string {
  const start = toICalDateTime(result.date, result.time);
  const end = addMinutes(result.date, result.time, result.durationMin);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${result.serviceName} @ ${salonName}`,
    `LOCATION:${address}`,
    `DESCRIPTION:Резервация в ${salonName}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return "data:text/calendar;charset=utf8," + encodeURIComponent(lines.join("\r\n"));
}

export function BookingCalendar({
  salonSlug, salonName, salonPhone, salonAddress, salonGoogleMapsEmbed,
  services, workingHours, initialSpecialistId, isDemo = false,
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
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // Map day_of_week → is_day_off (0=Sun … 6=Sat)
  const workingDays = new Set(workingHours.filter((wh) => !wh.is_day_off).map((wh) => wh.day_of_week));

  const today = todayStr();

  // Fetch slots when date/service change
  useEffect(() => {
    setSelectedTime(null);
    if (!selectedDate || !serviceId) { setSlots([]); return; }
    if (isDemo) { setSlots(DEMO_SLOTS); return; }
    setSlotsLoading(true);
    fetch(`/api/availability?salon_slug=${encodeURIComponent(salonSlug)}&service_id=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(selectedDate)}`)
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
  }, [selectedDate, serviceId, salonSlug, isDemo, today]);

  async function handleSubmit() {
    if (!selectedDate || !selectedTime || !serviceId || !name.trim() || !isValidPhone(phone) || !email.trim()) return;
    setSubmitStatus("loading");
    setErrorMsg("");
    const svc = active.find((s) => s.id === serviceId);
    const result: BookingResult = {
      serviceName: svc?.name ?? selectedServiceName,
      date: selectedDate,
      time: selectedTime,
      durationMin: svc?.duration_minutes ?? 60,
    };
    if (isDemo) {
      await new Promise((r) => setTimeout(r, 900));
      setBookingResult(result);
      setSubmitStatus("success");
      return;
    }
    try {
      const bookingResultData = await createBooking({
        salon_slug: salonSlug,
        service_id: serviceId,
        booking_date: selectedDate,
        booking_time: selectedTime,
        client_name: name.trim(),
        client_phone: phone.trim(),
        client_email: email.trim(),
        specialist_id: initialSpecialistId ?? undefined,
      });
      if ("error" in bookingResultData) {
        setErrorMsg(bookingResultData.error);
        setSubmitStatus("error");
      } else {
        setBookingResult(result);
        setSubmitStatus("success");
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

  if (submitStatus === "success" && bookingResult) {
    const address = salonAddress ?? "";
    const googleUrl = googleCalUrl(bookingResult, salonName, address);
    const appleUrl = appleCalUrl(bookingResult, salonName, address);
    const mapsUrl = address
      ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
      : null;
    const formattedDate = new Date(`${bookingResult.date}T12:00:00`).toLocaleDateString("bg-BG", {
      weekday: "long", day: "numeric", month: "long",
    });
    return (
      <>
        <style>{`
          .bcal-confirm { max-width: 520px; margin: 0 auto; padding: 8px 0 32px; }
          .bcal-confirm-check {
            width: 64px; height: 64px; border-radius: 50%;
            background: color-mix(in srgb, var(--color-primary) 15%, transparent);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px;
          }
          .bcal-confirm-check svg { color: var(--color-primary); }
          .bcal-confirm-title {
            font-size: 26px; font-weight: 700; text-align: center;
            color: var(--color-text); font-family: var(--font-heading);
            margin-bottom: 6px;
          }
          .bcal-confirm-sub {
            text-align: center; font-size: 15px;
            color: var(--color-text); opacity: 0.55;
            font-family: var(--font-body); line-height: 1.6;
            margin-bottom: 28px;
          }
          .bcal-confirm-card {
            background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg));
            border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
            border-radius: var(--border-radius, 14px);
            padding: 20px 22px; margin-bottom: 16px;
          }
          .bcal-confirm-card-label {
            font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
            text-transform: uppercase; color: var(--color-primary);
            font-family: var(--font-nav); margin-bottom: 12px;
          }
          .bcal-confirm-row {
            display: flex; align-items: flex-start; gap: 10px;
            font-family: var(--font-body); color: var(--color-text);
            margin-bottom: 8px;
          }
          .bcal-confirm-row:last-child { margin-bottom: 0; }
          .bcal-confirm-row-icon { opacity: 0.5; flex-shrink: 0; margin-top: 1px; }
          .bcal-confirm-row-main { font-size: 15px; font-weight: 600; }
          .bcal-confirm-row-sub { font-size: 13px; opacity: 0.6; margin-top: 1px; }
          .bcal-confirm-cal-btns {
            display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
            margin-bottom: 16px;
          }
          .bcal-confirm-cal-btn {
            display: flex; align-items: center; justify-content: center; gap: 7px;
            padding: 12px 14px;
            border: 1.5px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
            border-radius: var(--border-radius, 10px);
            background: transparent; color: var(--color-text);
            font-size: 13px; font-weight: 600; font-family: var(--font-body);
            cursor: pointer; text-decoration: none;
            transition: background 0.15s, border-color 0.15s;
          }
          .bcal-confirm-cal-btn:hover {
            background: color-mix(in srgb, var(--color-primary) 8%, transparent);
            border-color: var(--color-primary);
          }
          .bcal-confirm-map-link {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 13px; font-weight: 600; color: var(--color-primary);
            font-family: var(--font-body); text-decoration: none;
            margin-top: 4px;
          }
          .bcal-confirm-map-link:hover { text-decoration: underline; }
          .bcal-confirm-tel {
            color: var(--color-text); text-decoration: none; font-weight: 600;
            font-size: 15px;
          }
          .bcal-confirm-tel:hover { color: var(--color-primary); }
          .bcal-confirm-embed {
            width: 100%; height: 180px; border: none;
            border-radius: var(--border-radius, 10px);
            margin-top: 14px; display: block;
          }
        `}</style>
        <div className="bcal-confirm">
          <div className="bcal-confirm-check">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="bcal-confirm-title">Часът е запазен!</h3>
          <p className="bcal-confirm-sub">
            Потвърждение ще получите на имейл.<br />Напомняне ще бъде изпратено преди часа.
          </p>

          {/* Booking summary */}
          <div className="bcal-confirm-card">
            <p className="bcal-confirm-card-label">Вашата резервация</p>
            <div className="bcal-confirm-row">
              <svg className="bcal-confirm-row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
              <div>
                <div className="bcal-confirm-row-main">{bookingResult.serviceName}</div>
                <div className="bcal-confirm-row-sub">{bookingResult.durationMin} минути</div>
              </div>
            </div>
            <div className="bcal-confirm-row">
              <svg className="bcal-confirm-row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <div>
                <div className="bcal-confirm-row-main" style={{ textTransform: "capitalize" }}>{formattedDate}</div>
                <div className="bcal-confirm-row-sub">в {bookingResult.time} ч.</div>
              </div>
            </div>
          </div>

          {/* Add to calendar */}
          <div className="bcal-confirm-cal-btns">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="bcal-confirm-cal-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Google Calendar
            </a>
            <a href={appleUrl} download="rezervacia.ics" className="bcal-confirm-cal-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Apple Calendar
            </a>
          </div>

          {/* Salon contact info */}
          {(salonPhone ?? salonAddress ?? salonGoogleMapsEmbed) && (
            <div className="bcal-confirm-card">
              <p className="bcal-confirm-card-label">Как да ни намерите</p>
              {salonPhone && (
                <div className="bcal-confirm-row">
                  <svg className="bcal-confirm-row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <div>
                    <a href={`tel:${salonPhone.replace(/\s/g, "")}`} className="bcal-confirm-tel">{salonPhone}</a>
                  </div>
                </div>
              )}
              {salonAddress && (
                <div className="bcal-confirm-row">
                  <svg className="bcal-confirm-row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <div className="bcal-confirm-row-main">{salonAddress}</div>
                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="bcal-confirm-map-link">
                        Виж в Google Карти
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
              {salonGoogleMapsEmbed && (
                <iframe
                  src={salonGoogleMapsEmbed}
                  className="bcal-confirm-embed"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта на салона"
                />
              )}
            </div>
          )}
        </div>
      </>
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
                {s.name}{s.price_eur ? ` — ${Number(s.price_eur).toFixed(0)} € (~${(Number(s.price_eur) * 1.956).toFixed(2)} лв)` : ""}
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
                        onBlur={() => setPhoneTouched(true)}
                      />
                      {phoneTouched && phone.trim() !== "" && !isValidPhone(phone) ? (
                        <p className="bcal-error" style={{ marginTop: "-4px" }}>
                          Невалиден телефон — проверете броя на цифрите (напр. 0888 123 456).
                        </p>
                      ) : null}
                      <input
                        className="bcal-input"
                        type="email"
                        placeholder="Имейл *"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailSuggestion) setEmailSuggestion(null);
                        }}
                        onBlur={() => setEmailSuggestion(suggestEmailFix(email))}
                      />
                      {emailSuggestion ? (
                        <p style={{ fontSize: "12px", color: "#92600a", margin: "-4px 0 4px" }}>
                          Имахте предвид{" "}
                          <button
                            type="button"
                            style={{ font: "inherit", fontWeight: 700, textDecoration: "underline", background: "none", border: 0, padding: 0, cursor: "pointer", color: "inherit" }}
                            onClick={() => {
                              setEmail(emailSuggestion);
                              setEmailSuggestion(null);
                            }}
                          >
                            {emailSuggestion}
                          </button>
                          ?
                        </p>
                      ) : null}
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
