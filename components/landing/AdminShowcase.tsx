"use client";

import { useState, useEffect } from "react";

const TABS = [
  { key: "dashboard", label: "Днес",       img: "/screenshots/admin-dashboard.png"   },
  { key: "clients",   label: "Клиенти",    img: "/screenshots/admin-clients.png"     },
  { key: "rezerv",    label: "Резервации", img: "/screenshots/admin-rezervation.png" },
  { key: "services",  label: "Услуги",     img: "/screenshots/admin-services.png"    },
  { key: "finance",   label: "Финанси",    img: "/screenshots/admin-finance.png"     },
];

const FLOAT_CARDS = [
  {
    pos: "top-[8%] right-[2%]",
    content: (
      <div className="flex items-center gap-2.5">
        <span className="text-xl">💰</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9a8a6a]">Оборот днес</p>
          <p className="text-lg font-bold text-[#3D1F0A]">400.00 €</p>
        </div>
      </div>
    ),
  },
  {
    pos: "top-[38%] right-[-2%]",
    content: (
      <div className="flex items-center gap-2.5">
        <span className="text-xl">📅</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9a8a6a]">Следващ клиент</p>
          <p className="text-sm font-bold text-[#3D1F0A]">18:45 · Наталия</p>
        </div>
      </div>
    ),
  },
  {
    pos: "bottom-[18%] right-[0%]",
    content: (
      <div className="flex items-center gap-2.5">
        <span className="text-xl">✅</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9a8a6a]">SMS напомняне</p>
          <p className="text-sm font-bold text-[#3D1F0A]">Изпратено автоматично</p>
        </div>
      </div>
    ),
  },
];

export default function AdminShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % TABS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#F8EBDD] px-6 py-16 sm:px-8 lg:px-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_52%,rgba(199,154,75,0.16),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(61,31,10,0.06),transparent_30%)]" />

      <div className="relative mx-auto grid max-w-[1450px] items-center gap-10 lg:grid-cols-[minmax(390px,0.92fr)_minmax(560px,1.08fr)] xl:gap-16">
        {/* ── LEFT: Phone + floating cards ── */}
        <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[520px]">

          {/* Glow */}
          <div
            className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ width: 430, height: 430, background: "rgba(199,154,75,0.18)", zIndex: 0 }}
          />

          {/* Phone screenshot */}
          <div className="float-phone relative z-10 mx-auto w-[74%] max-w-[360px]">
            {TABS.map((tab, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={tab.key}
                src={tab.img}
                alt={tab.label}
                className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}
            {/* Placeholder height */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TABS[0].img} alt="" className="invisible w-full" />
          </div>

          {/* Floating stat cards — desktop only */}
          {FLOAT_CARDS.map((card, i) => (
            <div
              key={i}
              className={`absolute hidden lg:flex ${card.pos} z-20 items-center rounded-2xl bg-white px-4 py-3 xl:px-5`}
              style={{
                boxShadow: "0 18px 55px rgba(61,31,10,0.13)",
                border: "1px solid rgba(199,154,75,0.15)",
                minWidth: 220,
                animation: `float-phone ${3.5 + i * 0.7}s ease-in-out infinite`,
              }}
            >
              {card.content}
            </div>
          ))}
        </div>

        {/* ── RIGHT: Copy + controls + features ── */}
        <div className="w-full">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C79A4B]">
            Админ панел
          </p>
          <h2
            className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-[#3D1F0A] md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Управлявай салона спокойно, дори когато си между клиенти.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#6E6A63]">
            Всичко важно е на едно място: график, клиенти, услуги, финанси и напомняния. Панелът е направен за ежедневна работа в салон, не за сложни настройки.
          </p>

          {/* Tab buttons */}
          <div className="mt-8 flex flex-wrap gap-2">
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setActive(i)}
                className="rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200 lg:px-5 lg:py-2.5"
                style={
                  i === active
                    ? { background: "#3D1F0A", color: "#fff" }
                    : { background: "#EEE6DC", color: "#6E6A63" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature list */}
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: "📱", text: "Работи от всеки телефон — без инсталация" },
              { icon: "⚡", text: "Промени влизат веднага в живо" },
              { icon: "📊", text: "Виждаш оборота, разходите и печалбата в реално време" },
              { icon: "🔔", text: "SMS напомняния се изпращат автоматично" },
              { icon: "🛠", text: "Ние настройваме всичко вместо теб" },
            ].map((item) => (
              <li
                key={item.text}
                className="flex min-h-[72px] items-start gap-3 rounded-xl border border-[#E8DDD0] bg-white/45 px-4 py-4"
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-sm leading-relaxed text-[#5A5550]">{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-4 border-t border-[#E8DDD0] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-5">
              {[
                ["24/7", "записвания"],
                ["0", "инсталации"],
                ["1", "панел"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-xl font-bold text-[#3D1F0A]">{value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a8a6a]">{label}</p>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex gap-2">
              {TABS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Покажи ${TABS[i].label}`}
                  style={{
                    width: i === active ? 24 : 8,
                    height: 8,
                    borderRadius: 999,
                    background: i === active ? "#C79A4B" : "#E8DDD0",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
