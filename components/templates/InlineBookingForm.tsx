"use client";

import { useState } from "react";
import type { Service } from "@/types/database";

interface Props {
  salonSlug: string;
  services: Service[];
  primaryColor: string;
  textColor?: string;
  bgColor?: string;
  isDemo?: boolean;
}

export function InlineBookingForm({ salonSlug, services, primaryColor, textColor = "#1a1a1a", bgColor = "#ffffff", isDemo = false }: Props) {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const activeServices = services.filter((s) => s.is_active);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !date || !name || !phone) return;

    setStatus("loading");
    setErrorMsg("");

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 800));
      setStatus("success");
      return;
    }

    try {
      const selected = activeServices.find((s) => s.id === service);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_slug: salonSlug,
          service_id: selected?.id,
          service_name: selected?.name ?? service,
          service_price_eur: selected?.price_eur ?? 0,
          service_duration: selected?.duration_minutes ?? 60,
          booking_date: date,
          booking_time: "00:00",
          client_name: name,
          client_phone: phone,
          client_email: email || undefined,
          notes: "Онлайн запитване — часът се потвърждава от салона.",
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

  const label: React.CSSProperties = {
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

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ display: "grid", gap: "18px" }}>
        {/* Service */}
        <div>
          <label style={label}>Услуга</label>
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
          <label style={label}>Предпочитана дата</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            required
            style={input}
          />
        </div>

        {/* Name + Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={label}>Вашето име</label>
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
            <label style={label}>Телефон</label>
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
          <label style={label}>Имейл</label>
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
          <p style={{ color: "#e53e3e", fontSize: "13px", textAlign: "center" }}>{errorMsg}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
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
            cursor: status === "loading" ? "not-allowed" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {status === "loading" ? "Изпращане…" : "Потвърдете резервацията"}
        </button>

        <p style={{ textAlign: "center", fontSize: "12px", color: textColor, opacity: 0.4 }}>
          ✦ Ще получите имейл потвърждение · Напомняне 12 часа преди часа
        </p>
      </div>
    </form>
  );
}
