"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { MARKETING_PLANS, type PlanId } from "@/lib/marketing-data";
import { stripePaymentLinkForPlan } from "@/lib/marketing-checkout";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";
const DARK = "#1A1A1A";
const CREAM = "#EAD5C4";
const MUTED = "rgba(26,26,26,0.45)";
const BORDER = "rgba(201,168,76,0.25)";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  border: `1px solid ${BORDER}`,
  borderRadius: "6px",
  fontSize: "15px",
  color: DARK,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: GOLD,
  marginBottom: "7px",
};

type Step = 1 | 2 | 3;

export function GetStartedForm(props: { initialPlan?: PlanId }) {
  const [step, setStep] = useState<Step>(() => (props.initialPlan ? 2 : 1));
  const [plan, setPlan] = useState<PlanId | null>(() => props.initialPlan ?? null);
  const [salonName, setSalonName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planMeta = useMemo(() => MARKETING_PLANS.find((p) => p.id === plan), [plan]);
  const payUrl = plan ? stripePaymentLinkForPlan(plan) : undefined;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!plan) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          salon_name: salonName,
          contact_name: contactName,
          email,
          phone: phone || undefined,
          message: message || undefined,
          source: "get-started",
          company_website: String(fd.get("company_website") ?? ""),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "Неуспешно изпращане.");
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: DARK, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* NAV */}
      <header style={{
        borderBottom: `1px solid ${BORDER}`,
        background: "rgba(250,247,242,0.96)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", color: MUTED, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            ← Начало
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* HEADING */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: GOLD, marginBottom: "16px" }}>
            ✦ SalonApp.pro
          </span>
          <h1 style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            color: DARK,
            marginBottom: "14px",
          }}>
            Започни безплатно.
          </h1>
          <p style={{ fontSize: "15px", color: MUTED, lineHeight: 1.8, maxWidth: "420px", margin: "0 auto" }}>
            Попълни кратка форма — ние се свързваме лично с теб и настройваме всичко заедно.
          </p>
        </div>

        {/* STEP INDICATORS */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "48px" }}>
          {([
            { s: 1 as const, label: "План" },
            { s: 2 as const, label: "Данни" },
            { s: 3 as const, label: "Готово" },
          ]).map(({ s, label }) => (
            <div key={s} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 16px",
              borderRadius: "40px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              background: step >= s ? `linear-gradient(135deg, ${GOLD}, ${ROSE})` : "rgba(26,26,26,0.07)",
              color: step >= s ? "#fff" : MUTED,
              transition: "all 0.3s",
            }}>
              <span>{s}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* ── STEP 1: PLAN SELECTION ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {MARKETING_PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPlan(p.id); setStep(2); }}
                style={{
                  width: "100%",
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  padding: "22px 24px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD;
                  e.currentTarget.style.boxShadow = `0 4px 24px rgba(201,168,76,0.12)`;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: DARK, marginBottom: "4px" }}>{p.name}</div>
                  <div style={{ fontSize: "13px", color: MUTED }}>{p.tagline}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: GOLD }}>{p.priceMonthly} {p.priceCurrency}</div>
                  <div style={{ fontSize: "11px", color: MUTED }}>/ {p.periodLabel}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2: CONTACT FORM ── */}
        {step === 2 && plan && planMeta && (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Selected plan card */}
            <div style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "18px 22px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD, marginBottom: "4px" }}>Избран план</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: DARK }}>
                  {planMeta.name} · {planMeta.priceMonthly} {planMeta.priceCurrency} / {planMeta.periodLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ fontSize: "12px", fontWeight: 700, color: MUTED, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", marginLeft: "12px" }}
              >
                Промени
              </button>
            </div>

            {payUrl && (
              <div style={{ textAlign: "center" }}>
                <a href={payUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "13px", fontWeight: 700, color: GOLD, textDecoration: "none", letterSpacing: "0.05em" }}>
                  Плати онлайн с карта →
                </a>
              </div>
            )}

            {/* Fields */}
            <div>
              <label style={labelStyle}>Име на салона *</label>
              <input style={inputStyle} value={salonName} onChange={(e) => setSalonName(e.target.value)} required autoComplete="organization"
                onFocus={(e) => (e.target.style.borderColor = GOLD)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)} />
            </div>
            <div>
              <label style={labelStyle}>Вашето име *</label>
              <input style={inputStyle} value={contactName} onChange={(e) => setContactName(e.target.value)} required autoComplete="name"
                onFocus={(e) => (e.target.style.borderColor = GOLD)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Имейл *</label>
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  onFocus={(e) => (e.target.style.borderColor = GOLD)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)} />
              </div>
              <div>
                <label style={labelStyle}>Телефон</label>
                <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+359 88..."
                  onFocus={(e) => (e.target.style.borderColor = GOLD)}
                  onBlur={(e) => (e.target.style.borderColor = BORDER)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Бележки <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: MUTED }}>(незадължително)</span></label>
              <textarea
                style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Вид салон, брой специалисти, въпроси..."
                onFocus={(e) => (e.target.style.borderColor = GOLD)}
                onBlur={(e) => (e.target.style.borderColor = BORDER)}
              />
            </div>

            {/* Honeypot */}
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden />

            {error && (
              <p style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", padding: "10px", background: "#fef2f2", borderRadius: "6px" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                background: loading ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Изпращане…" : "Изпрати заявката →"}
            </button>

            <p style={{ textAlign: "center", fontSize: "12px", color: MUTED }}>
              Без банкова карта. Без договори. Спираш, когато поискаш.
            </p>
          </form>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {/* Big checkmark */}
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              fontSize: "32px",
            }}>
              ✓
            </div>

            <h2 style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 800,
              color: DARK,
              marginBottom: "16px",
              lineHeight: 1.2,
            }}>
              Заявката е изпратена!
            </h2>

            <p style={{ fontSize: "16px", color: MUTED, lineHeight: 1.8, maxWidth: "420px", margin: "0 auto 12px" }}>
              Скоро ще получиш обаждане от нас — ще уточним всички детайли, ще настроим салона ти и ще те стартираме бързо и лесно. 🌸
            </p>
            <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.7, maxWidth: "380px", margin: "0 auto 36px" }}>
              Обаждаме се в рамките на работния ден. Ако имаш въпрос — пиши ни на{" "}
              <a href="mailto:salonapppro@gmail.com" style={{ color: GOLD, fontWeight: 700, textDecoration: "none" }}>salonapppro@gmail.com</a>.
            </p>

            {/* Decorative divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "200px", margin: "0 auto 36px" }}>
              <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
              <span style={{ color: GOLD, fontSize: "14px" }}>✦</span>
              <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
            </div>

            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 28px",
                background: `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
                color: "#fff",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              ← Към началната страница
            </Link>
          </div>
        )}
      </main>

      {/* Footer glow */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: `linear-gradient(90deg, transparent, ${GOLD}, ${ROSE}, transparent)`,
        opacity: 0.6,
        pointerEvents: "none",
      }} />
    </div>
  );
}
