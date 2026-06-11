"use client";

import { useState, useEffect, useRef } from "react";
import type { Service } from "@/types/database";
import { isLikelyValidPhone } from "@/lib/phone";
import { suggestEmailFix } from "@/lib/email-typo";

function MiniCalendar({ value, min, onChange, primaryColor, textColor, inputStyle }: {
  value: string; min: string; onChange: (d: string) => void;
  primaryColor: string; textColor: string;
  inputStyle: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const todayDate = new Date(); todayDate.setHours(0,0,0,0);
  const minDate = min ? (() => { const d = new Date(min); d.setHours(0,0,0,0); return d; })() : null;
  const initD = value ? new Date(value + "T00:00:00") : new Date();
  const [vy, setVy] = useState(initD.getFullYear());
  const [vm, setVm] = useState(initD.getMonth());

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const months = ["Януари","Февруари","Март","Април","Май","Юни","Юли","Август","Септември","Октомври","Ноември","Декември"];
  const days  = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];

  const prevM = () => { if (vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1); };
  const nextM = () => { if (vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1); };

  const dim = new Date(vy, vm+1, 0).getDate();
  const start = (new Date(vy, vm, 1).getDay()+6)%7;
  const cells: (number|null)[] = Array(start).fill(null);
  for (let d=1; d<=dim; d++) cells.push(d);

  const toStr = (d: number) => `${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const isPast = (d: number) => { if (!minDate) return false; const dt=new Date(vy,vm,d); dt.setHours(0,0,0,0); return dt<minDate; };
  const isToday = (d: number) => { const dt=new Date(vy,vm,d); dt.setHours(0,0,0,0); return dt.getTime()===todayDate.getTime(); };

  const displayValue = value
    ? (() => { const [y,m,d] = value.split("-"); return `${d}.${m}.${y}`; })()
    : "дд.мм.гггг";

  const select = (d: number) => {
    if (isPast(d)) return;
    onChange(toStr(d));
    setOpen(false);
  };

  return (
    <div ref={ref} style={{position:"relative",width:"100%"}}>
      {/* Trigger input */}
      <button type="button" onClick={()=>setOpen(o=>!o)} style={{
        ...inputStyle,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        cursor:"pointer", textAlign:"left",
        color: value ? textColor : `${textColor}55`,
      }}>
        <span>{displayValue}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:50,
          background:"rgba(18,6,2,0.99)", border:`1px solid ${primaryColor}45`,
          borderRadius:"10px", padding:"16px", boxShadow:"0 16px 48px rgba(0,0,0,0.6)",
        }}>
          {/* Month nav */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
            <button type="button" onClick={prevM} style={{background:"none",border:"none",color:primaryColor,cursor:"pointer",fontSize:"22px",lineHeight:1,padding:"0 8px"}}>‹</button>
            <span style={{color:textColor,fontSize:"13px",fontWeight:600,letterSpacing:"0.08em"}}>{months[vm]} {vy}</span>
            <button type="button" onClick={nextM} style={{background:"none",border:"none",color:primaryColor,cursor:"pointer",fontSize:"22px",lineHeight:1,padding:"0 8px"}}>›</button>
          </div>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"6px"}}>
            {days.map(d=><div key={d} style={{textAlign:"center",fontSize:"10px",color:primaryColor,fontWeight:700,letterSpacing:"0.06em",padding:"3px 0"}}>{d}</div>)}
          </div>
          {/* Day cells */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>
            {cells.map((d,i)=>{
              if(!d) return <div key={`e${i}`}/>;
              const sel=toStr(d)===value, past=isPast(d), tod=isToday(d);
              return (
                <button key={d} type="button" disabled={past} onClick={()=>select(d)} style={{
                  background: sel ? primaryColor : tod ? `${primaryColor}20` : "transparent",
                  color: past ? `${textColor}25` : sel ? "#1C0D06" : tod ? primaryColor : textColor,
                  border: tod&&!sel ? `1px solid ${primaryColor}50` : "1px solid transparent",
                  borderRadius:"5px", padding:"8px 2px", fontSize:"13px",
                  cursor: past?"default":"pointer", fontWeight: sel?700:400,
                  textAlign:"center", transition:"background 0.12s",
                }}>{d}</button>
              );
            })}
          </div>
          {/* Clear */}
          {value && (
            <div style={{marginTop:"12px",display:"flex",justifyContent:"flex-end"}}>
              <button type="button" onClick={()=>{onChange("");setOpen(false);}} style={{background:"none",border:"none",color:primaryColor,cursor:"pointer",fontSize:"11px",letterSpacing:"0.1em",opacity:.65}}>ИЗЧИСТИ</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TimeSlot {
  time: string;
  magnetic: boolean;
}

const DEMO_SLOTS: TimeSlot[] = [
  { time: "09:00", magnetic: true },
  { time: "09:30", magnetic: false },
  { time: "10:00", magnetic: true },
  { time: "10:30", magnetic: false },
  { time: "11:00", magnetic: true },
  { time: "11:30", magnetic: false },
  { time: "13:00", magnetic: true },
  { time: "14:00", magnetic: false },
  { time: "15:00", magnetic: true },
  { time: "16:00", magnetic: false },
];

interface BookingResult {
  serviceName: string;
  date: string;
  time: string;
  durationMin: number;
}

function toICalDateTime(dateStr: string, timeStr: string): string {
  return dateStr.replace(/-/g, "") + "T" + timeStr.replace(":", "") + "00";
}

function addMinutes(dateStr: string, timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + mins;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return toICalDateTime(dateStr, `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
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
    "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
    `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${result.serviceName} @ ${salonName}`,
    `LOCATION:${address}`,
    `DESCRIPTION:Резервация в ${salonName}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return "data:text/calendar;charset=utf8," + encodeURIComponent(lines.join("\r\n"));
}

interface Props {
  salonSlug: string;
  salonName: string;
  salonPhone?: string | null;
  salonAddress?: string | null;
  salonGoogleMapsEmbed?: string | null;
  services: Service[];
  /** Pass a CSS hex value OR a CSS var reference like "var(--color-primary)" */
  primaryColor: string;
  textColor?: string;
  bgColor?: string;
  isDemo?: boolean;
}

export function InlineBookingForm({
  salonSlug,
  salonName,
  salonPhone,
  salonAddress,
  salonGoogleMapsEmbed,
  services,
  primaryColor,
  textColor = "var(--color-text, #1a1a1a)",
  bgColor = "var(--color-bg, #ffffff)",
  isDemo = false,
}: Props) {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const activeServices = services.filter((s) => s.is_active);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setTime("");
    if (!service || !date) { setSlots([]); return; }
    if (isDemo) { setSlots(DEMO_SLOTS); return; }
    setSlotsLoading(true);
    fetch(`/api/bookings?salon_slug=${encodeURIComponent(salonSlug)}&service_id=${encodeURIComponent(service)}&date=${encodeURIComponent(date)}`)
      .then((r) => r.json())
      .then((json: { slots?: TimeSlot[] }) => setSlots(json.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [service, date, salonSlug, isDemo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !date || !time || !name || !phone || !isLikelyValidPhone(phone)) return;
    setStatus("loading");
    setErrorMsg("");
    const svc = activeServices.find((s) => s.id === service);
    const result: BookingResult = {
      serviceName: svc?.name ?? service,
      date,
      time,
      durationMin: svc?.duration_minutes ?? 60,
    };
    if (isDemo) {
      await new Promise((r) => setTimeout(r, 800));
      setBookingResult(result);
      setStatus("success");
      return;
    }
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_slug: salonSlug,
          service_id: service,
          booking_date: date,
          booking_time: time,
          client_name: name,
          client_phone: phone,
          client_email: email || undefined,
        }),
      });
      if (res.ok) {
        setBookingResult(result);
        setStatus("success");
      } else {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(json.error ?? "Възникна грешка. Опитайте пак.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Проблем с връзката. Опитайте пак.");
      setStatus("error");
    }
  }

  if (status === "success" && bookingResult) {
    const address = salonAddress ?? "";
    const googleUrl = googleCalUrl(bookingResult, salonName, address);
    const appleUrl = appleCalUrl(bookingResult, salonName, address);
    const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null;
    const formattedDate = new Date(`${bookingResult.date}T12:00:00`).toLocaleDateString("bg-BG", {
      weekday: "long", day: "numeric", month: "long",
    });

    const card: React.CSSProperties = {
      background: `color-mix(in srgb, ${primaryColor} 8%, ${bgColor})`,
      border: `1px solid color-mix(in srgb, ${primaryColor} 22%, transparent)`,
      borderRadius: "12px",
      padding: "18px 20px",
      marginBottom: "12px",
      color: textColor,
    };
    const label: React.CSSProperties = {
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em",
      textTransform: "uppercase", color: primaryColor, marginBottom: "12px",
      fontFamily: "inherit",
    };
    const row: React.CSSProperties = {
      display: "flex", alignItems: "flex-start", gap: "10px",
      marginBottom: "8px", color: textColor,
    };
    const calBtn: React.CSSProperties = {
      display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
      padding: "11px 10px",
      border: `1.5px solid color-mix(in srgb, ${primaryColor} 30%, transparent)`,
      borderRadius: "10px", background: "transparent", color: textColor,
      fontSize: "13px", fontWeight: 600, cursor: "pointer",
      textDecoration: "none", fontFamily: "inherit", flex: 1,
    };

    return (
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "8px 0 24px" }}>
        {/* Check icon */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%",
            background: `color-mix(in srgb, ${primaryColor} 15%, transparent)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: textColor, marginBottom: "6px", fontFamily: "inherit" }}>
            Часът е запазен!
          </h3>
          <p style={{ fontSize: "14px", color: textColor, opacity: 0.55, lineHeight: 1.6, fontFamily: "inherit" }}>
            Потвърждение ще получите на имейл.<br />Напомняне ще бъде изпратено преди часа.
          </p>
        </div>

        {/* Booking summary */}
        <div style={card}>
          <p style={label}>Вашата резервация</p>
          <div style={row}>
            <svg style={{ opacity: 0.45, flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600 }}>{bookingResult.serviceName}</div>
              <div style={{ fontSize: "13px", opacity: 0.55, marginTop: "2px" }}>{bookingResult.durationMin} минути</div>
            </div>
          </div>
          <div style={{ ...row, marginBottom: 0 }}>
            <svg style={{ opacity: 0.45, flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, textTransform: "capitalize" }}>{formattedDate}</div>
              <div style={{ fontSize: "13px", opacity: 0.55, marginTop: "2px" }}>в {bookingResult.time} ч.</div>
            </div>
          </div>
        </div>

        {/* Calendar buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" style={calBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Google Calendar
          </a>
          <a href={appleUrl} download="rezervacia.ics" style={calBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Apple Calendar
          </a>
        </div>

        {/* Salon contact */}
        {(salonPhone ?? salonAddress ?? salonGoogleMapsEmbed) && (
          <div style={card}>
            <p style={label}>Как да ни намерите</p>
            {salonPhone && (
              <div style={row}>
                <svg style={{ opacity: 0.45, flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <a href={`tel:${salonPhone.replace(/\s/g, "")}`} style={{ color: textColor, textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>{salonPhone}</a>
              </div>
            )}
            {salonAddress && (
              <div style={{ ...row, marginBottom: 0 }}>
                <svg style={{ opacity: 0.45, flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600 }}>{salonAddress}</div>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 600, color: primaryColor, textDecoration: "none", marginTop: "4px" }}>
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
                style={{ width: "100%", height: "170px", border: "none", borderRadius: "10px", marginTop: "14px", display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Карта на салона"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  const canSubmit = !!(service && date && time && name && phone && isLikelyValidPhone(phone)) && status !== "loading";

  // All colors flow through CSS variables set on the wrapper div.
  // color-mix() creates transparent variants that update live in the builder.
  const wrapperVars = {
    "--ibf-primary": primaryColor,
    "--ibf-text": textColor,
    "--ibf-bg": bgColor,
  } as React.CSSProperties;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid color-mix(in srgb, var(--ibf-primary) 30%, transparent)",
    borderRadius: "8px",
    fontSize: "15px",
    color: "var(--ibf-text)",
    backgroundColor: "var(--ibf-bg)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    colorScheme: "dark",
    accentColor: primaryColor,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ibf-primary)",
    marginBottom: "6px",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "520px", margin: "0 auto", ...wrapperVars }}>
      <div style={{ display: "grid", gap: "18px" }}>

        {/* Service */}
        <div>
          <label style={labelStyle}>Услуга</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">— Изберете услуга —</option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.price_eur ? ` — ${Number(s.price_eur).toFixed(0)} € (~${(Number(s.price_eur) * 1.956).toFixed(2)} лв)` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label style={labelStyle}>Дата</label>
          <MiniCalendar
            value={date}
            min={today}
            onChange={setDate}
            primaryColor={primaryColor}
            textColor={textColor}
            inputStyle={inputStyle}
          />
          <input type="hidden" value={date} required />
        </div>

        {/* Time slots — appear once service + date are chosen */}
        {service && date && (
          <div>
            <label style={labelStyle}>Час</label>
            {slotsLoading ? (
              <p style={{ fontSize: "13px", color: "var(--ibf-text)", opacity: 0.5, margin: 0 }}>
                Зареждане на свободни часове…
              </p>
            ) : slots.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--ibf-text)", opacity: 0.5, margin: 0 }}>
                Няма свободни часове за тази дата. Опитайте друга дата.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {slots.map((slot) => {
                  const selected = time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setTime(slot.time)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        border: selected
                          ? "1.5px solid var(--ibf-primary)"
                          : "1.5px solid color-mix(in srgb, var(--ibf-primary) 35%, transparent)",
                        backgroundColor: selected ? "var(--ibf-primary)" : "transparent",
                        color: selected ? "#fff" : "var(--ibf-text)",
                        fontSize: "14px",
                        fontWeight: slot.magnetic ? 700 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        outline: "none",
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Name + Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Вашето име</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Мария Иванова"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              required
              placeholder="+359 88 888 8888"
              style={inputStyle}
            />
            {phoneTouched && phone.trim() !== "" && !isLikelyValidPhone(phone) ? (
              <p style={{ color: "#e53e3e", fontSize: "12px", margin: "4px 0 0" }}>
                Невалиден телефон — проверете броя на цифрите (напр. 0888 123 456).
              </p>
            ) : null}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Имейл</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailSuggestion) setEmailSuggestion(null);
            }}
            onBlur={() => setEmailSuggestion(suggestEmailFix(email))}
            placeholder="maria@example.com"
            style={inputStyle}
          />
          {emailSuggestion ? (
            <p style={{ fontSize: "12px", color: "#92600a", margin: "4px 0 0" }}>
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
        </div>

        {/* Error */}
        {status === "error" && (
          <p style={{ color: "#e53e3e", fontSize: "13px", textAlign: "center", margin: 0 }}>
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: "var(--ibf-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.5,
            transition: "opacity 0.2s",
            fontFamily: "inherit",
          }}
        >
          {status === "loading" ? "Изпращане…" : "Потвърдете резервацията"}
        </button>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--ibf-text)", opacity: 0.4, margin: 0 }}>
          ✦ Ще получите имейл потвърждение · Напомняне 12 часа преди часа
        </p>
      </div>
    </form>
  );
}
