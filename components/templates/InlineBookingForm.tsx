"use client";

import { useState, useEffect } from "react";
import type { Service } from "@/types/database";

interface TimeSlot {
  time: string;
  magnetic: boolean;
}

// Demo slots shown when isDemo=true (no real API call)
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

interface Props {
  salonSlug: string;
  services: Service[];
  primaryColor: string;
  textColor?: string;
  bgColor?: string;
  isDemo?: boolean;
}

export function InlineBookingForm({
  salonSlug,
  services,
  primaryColor,
  textColor = "#1a1a1a",
  bgColor = "#ffffff",
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
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const activeServices = services.filter((s) => s.is_active);
  const today = new Date().toISOString().split("T")[0];

  // Fetch available time slots whenever service + date change
  useEffect(() => {
    setTime("");
    if (!service || !date) {
      setSlots([]);
      return;
    }
    if (isDemo) {
      setSlots(DEMO_SLOTS);
      return;
    }
    setSlotsLoading(true);
    fetch(`/api/bookings?salon_slug=${encodeURIComponent(salonSlug)}&service_id=${encodeURIComponent(service)}&date=${encodeURIComponent(date)}`)
      .then((r) => r.json())
      .then((json: { slots?: TimeSlot[] }) => setSlots(json.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [service, date, salonSlug, isDemo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !date || !time || !name || !phone) return;

    setStatus("loading");
    setErrorMsg("");

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 800));
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

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${primaryColor}40`,
    borderRadius: "8px",
    fontSize: "15px",
    color: textColor,
    backgroundColor: bgColor,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: primaryColor,
    marginBottom: "6px",
  };

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
        <h3 style={{ fontSize: "22px", fontWeight: 700, color: textColor, marginBottom: "8px" }}>
          Заявката е изпратена!
        </h3>
        <p style={{ color: textColor, opacity: 0.6, fontSize: "15px", lineHeight: 1.6 }}>
          Ще получите потвърждение скоро.<br />
          Напомняне ще бъде изпратено преди часа.
        </p>
      </div>
    );
  }

  const canSubmit = !!(service && date && time && name && phone) && status !== "loading";

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ display: "grid", gap: "18px" }}>

        {/* Service */}
        <div>
          <label style={labelStyle}>Услуга</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
            style={{ ...input, cursor: "pointer" }}
          >
            <option value="">— Изберете услуга —</option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.price_eur ? ` — ${s.price_eur} €` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label style={labelStyle}>Дата</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            required
            style={input}
          />
        </div>

        {/* Time slots — appear once service + date are chosen */}
        {service && date && (
          <div>
            <label style={labelStyle}>Час</label>
            {slotsLoading ? (
              <p style={{ fontSize: "13px", color: textColor, opacity: 0.5, margin: 0 }}>
                Зареждане на свободни часове…
              </p>
            ) : slots.length === 0 ? (
              <p style={{ fontSize: "13px", color: textColor, opacity: 0.5, margin: 0 }}>
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
                        border: `1.5px solid ${selected ? primaryColor : primaryColor + "40"}`,
                        backgroundColor: selected ? primaryColor : "transparent",
                        color: selected ? "#fff" : textColor,
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Вашето име</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Мария Иванова"
              style={input}
            />
          </div>
          <div>
            <label style={labelStyle}>Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+359 88 888 8888"
              style={input}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Имейл</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maria@example.com"
            style={input}
          />
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
            backgroundColor: primaryColor,
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
          }}
        >
          {status === "loading" ? "Изпращане…" : "Потвърдете резервацията"}
        </button>

        <p style={{ textAlign: "center", fontSize: "12px", color: textColor, opacity: 0.4, margin: 0 }}>
          ✦ Ще получите имейл потвърждение · Напомняне 12 часа преди часа
        </p>
      </div>
    </form>
  );
}
