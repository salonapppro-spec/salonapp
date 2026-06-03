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
    <section className="bg-[#F8EBDD] px-8 py-14 lg:px-16">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C79A4B]">
          Админ панел
        </p>
        <h2
          className="mt-2 text-3xl font-bold text-[#3D1F0A] md:text-4xl"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Управлявай всичко от телефона.
        </h2>
        <p className="mt-3 max-w-lg text-sm text-[#6E6A63]">
          Прост панел, направен специално за салони — не за програмисти.
        </p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-8">

        {/* ── LEFT: Phone + floating cards ── */}
        <div className="relative mx-auto lg:mx-0" style={{ width: 280, flexShrink: 0 }}>

          {/* Glow */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ width: 260, height: 260, background: "rgba(199,154,75,0.18)", zIndex: 0 }}
          />

          {/* Phone screenshot */}
          <div className="float-phone relative z-10">
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
            <img src={TABS[0].img} alt="" className="invisible w-full" />
          </div>

          {/* Floating stat cards — desktop only */}
          {FLOAT_CARDS.map((card, i) => (
            <div
              key={i}
              className={`absolute hidden lg:flex ${card.pos} z-20 items-center rounded-2xl bg-white px-4 py-3`}
              style={{
                boxShadow: "0 8px 32px rgba(61,31,10,0.12)",
                border: "1px solid rgba(199,154,75,0.15)",
                minWidth: 200,
                animation: `float-phone ${3.5 + i * 0.7}s ease-in-out infinite`,
              }}
            >
              {card.content}
            </div>
          ))}
        </div>

        {/* ── RIGHT: Tabs + features ── */}
        <div className="flex-1">
          {/* Tab buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setActive(i)}
                className="rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200"
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
          <ul className="mb-8 space-y-4">
            {[
              { icon: "📱", text: "Работи от всеки телефон — без инсталация" },
              { icon: "⚡", text: "Промени влизат веднага в живо" },
              { icon: "📊", text: "Виждаш оборота, разходите и печалбата в реално време" },
              { icon: "🔔", text: "SMS напомняния се изпращат автоматично" },
              { icon: "🛠", text: "Ние настройваме всичко вместо теб" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm text-[#5A5550]">{item.text}</span>
              </li>
            ))}
          </ul>

          {/* Dots */}
          <div className="flex gap-2">
            {TABS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
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
    </section>
  );
}
