"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";
const DARK = "#1A1A1A";
const CREAM = "#F9F5F0";
const BORDER = "rgba(201,168,76,0.3)";
const MUTED = "rgba(26,26,26,0.5)";

const inputCls =
  "w-full rounded-lg border border-[rgba(201,168,76,0.3)] bg-white px-4 py-3 text-[15px] text-[#1A1A1A] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 placeholder:text-[#1A1A1A]/30";

const benefits = [
  { text: "0 лв. за първия месец", desc: "Пълен достъп до всички функции без риск." },
  { text: "Личен сайт до 24 часа", desc: "Професионално присъствие, което те отличава." },
  { text: "Ние настройваме всичко", desc: "Качваме услугите и графиците ти вместо теб." },
  { text: "100% Твои клиенти", desc: "Без комисионни и без реклами на твоите конкуренти." },
];

const businessTypes = ["Фризьорски", "Барбер", "Козметичен", "Нокти / маникюр", "Масажен", "Друго"];

export function GetStartedForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [salonName, setSalonName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) {
      setError("Моля, приемете общите условия.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "standard",
          salon_name: salonName,
          contact_name: fullName,
          phone: phone || undefined,
          business_type: businessType || undefined,
          source: "get-started",
          company_website: String(fd.get("company_website") ?? ""),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "Неуспешно изпращане.");
      router.push("/get-started/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка при изпращане.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: DARK, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* HEADER */}
      <header style={{
        borderBottom: `1px solid ${BORDER}`,
        background: "rgba(249,245,240,0.96)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", color: MUTED, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            ← Начало
          </Link>
          <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: GOLD }}>
            ✦ SalonApp.pro
          </span>
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* HEADING — centered */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 900,
            lineHeight: 1.2,
            color: DARK,
            marginBottom: "14px",
          }}>
            Заяви своя безплатен месец и лична настройка.
          </h1>
          <p style={{ fontSize: "16px", color: MUTED, lineHeight: 1.7, maxWidth: "520px", margin: "0 auto" }}>
            Без договори. Без скрити такси.{" "}
            <strong style={{ color: DARK }}>Ти само работиш, ние движим технологията.</strong>
          </p>
        </div>

        {/* SPLIT LAYOUT 50/50 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "48px",
          alignItems: "start",
        }}
          className="get-started-grid"
        >

          {/* ЛЯВА СТРАНА — Ползи */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: GOLD, marginBottom: "24px" }}>
              Какво получаваш
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {benefits.map((b) => (
                <div key={b.text} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "14px",
                  }}>
                    ✓
                  </div>
                  <div>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: DARK, marginBottom: "4px" }}>{b.text}</p>
                    <p style={{ fontSize: "14px", color: MUTED, lineHeight: 1.5 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div style={{
              marginTop: "40px",
              padding: "20px 24px",
              background: "white",
              borderRadius: "16px",
              border: `1px solid ${BORDER}`,
            }}>
              <p style={{ fontSize: "13px", fontStyle: "italic", color: DARK, lineHeight: 1.7, marginBottom: "12px" }}>
                „За 24 часа имах готов сайт и клиентите вече се записват сами. Нямах идея колко лесно е."
              </p>
              <p style={{ fontSize: "12px", fontWeight: 700, color: GOLD }}>— Мария, фризьор от Пловдив</p>
            </div>
          </div>

          {/* ДЯСНА СТРАНА — Форма */}
          <div style={{
            background: "white",
            borderRadius: "20px",
            border: `1px solid ${BORDER}`,
            padding: "40px 36px",
            boxShadow: "0 8px 40px rgba(201,168,76,0.08)",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: GOLD, marginBottom: "24px" }}>
              Твоите данни
            </p>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Honeypot */}
              <input type="text" name="company_website" tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden />

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
                  Ime и Фамилия *
                </label>
                <input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Напр. Мария Иванова"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
                  Телефон (за връзка с теб) *
                </label>
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  placeholder="+359 88 888 8888"
                  type="tel"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
                  Ime на салона *
                </label>
                <input
                  className={inputCls}
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  required
                  autoComplete="organization"
                  placeholder="Напр. Studio Elegance"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
                  Тип на бизнеса
                </label>
                <select
                  className={inputCls}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: `1px solid ${BORDER}`,
                    background: "white",
                    padding: "12px 16px",
                    fontSize: "15px",
                    color: businessType ? DARK : "rgba(26,26,26,0.3)",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="" disabled>Избери тип...</option>
                  {businessTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Checkbox */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: "3px", accentColor: GOLD, width: "16px", height: "16px", flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: MUTED, lineHeight: 1.5 }}>
                  Съгласявам се с{" "}
                  <Link href="#" style={{ color: GOLD, fontWeight: 700, textDecoration: "none" }}>
                    общите условия
                  </Link>{" "}
                  и обработката на личните ми данни.
                </span>
              </label>

              {error && (
                <p style={{ fontSize: "13px", color: "#dc2626", textAlign: "center", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "18px",
                  background: loading ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s",
                  marginTop: "4px",
                }}
              >
                {loading ? "Изпращане…" : "ЗАЯВИ БЕЗПЛАТЕН МЕСЕЦ"}
              </button>

              <p style={{ textAlign: "center", fontSize: "12px", color: MUTED, lineHeight: 1.6 }}>
                Наш консултант ще се свърже с теб в рамките на <strong>24 часа</strong>,
                за да подготвим сайта ти и да започнеш да приемаш резервации веднага.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .get-started-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

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
