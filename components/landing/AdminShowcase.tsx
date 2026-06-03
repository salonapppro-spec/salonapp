"use client";

import { useState } from "react";

const TABS = [
  {
    key: "dashboard",
    label: "Днес",
    img: "/screenshots/admin-dashboard.jpg",
    caption: "Оборот, резервации и следващ клиент — всичко с един поглед.",
  },
  {
    key: "clients",
    label: "Клиенти",
    img: "/screenshots/admin-clients.jpg",
    caption: "База клиенти — изгражда се автоматично с всяка резервация.",
  },
  {
    key: "reservation",
    label: "Резервации",
    img: "/screenshots/admin-reservation.jpg",
    caption: "Пълни детайли за всеки час — клиент, услуга, статус.",
  },
  {
    key: "services",
    label: "Услуги",
    img: "/screenshots/admin-services.jpg",
    caption: "Добавяш услуга за 30 секунди — само три полета.",
  },
];

export default function AdminShowcase() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-[#F8EBDD] px-8 py-14 lg:px-16">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C79A4B]">
          Админ панел
        </p>
        <h2
          className="playfair mt-2 text-3xl font-bold text-[#3D1F0A] md:text-4xl"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Управлявай всичко от телефона.
        </h2>
        <p className="mt-3 max-w-lg text-sm text-[#6E6A63]">
          Прост панел, направен специално за салони — не за програмисти.
        </p>
      </div>

      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-16">

        {/* Phone mockup */}
        <div className="relative shrink-0" style={{ width: 260 }}>
          {/* Phone frame */}
          <div
            className="relative overflow-hidden rounded-[36px] bg-white"
            style={{
              width: 260,
              height: 520,
              boxShadow: "0 24px 60px rgba(61,31,10,0.18), 0 0 0 8px #3D1F0A, 0 0 0 10px #C79A4B33",
            }}
          >
            {/* Notch */}
            <div
              className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-[#3D1F0A]"
              style={{ width: 80, height: 24 }}
            />
            {/* Screenshot */}
            {TABS.map((tab, i) => (
              <img
                key={tab.key}
                src={tab.img}
                alt={tab.label}
                className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}
          </div>

          {/* Glow */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full blur-2xl"
            style={{ width: 180, height: 40, background: "rgba(199,154,75,0.25)" }}
          />
        </div>

        {/* Tabs + caption */}
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
          <div className="space-y-4">
            <ul className="space-y-3">
              {[
                { icon: "✓", text: "Работи от всеки телефон — без инсталация" },
                { icon: "✓", text: "Промени влизат веднага в живо" },
                { icon: "✓", text: "Всичко на едно място — час, клиент, приход" },
                { icon: "✓", text: "Ние настройваме всичко вместо теб" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="mt-0.5 text-[#C79A4B] font-bold">{item.icon}</span>
                  <span className="text-sm text-[#5A5550]">{item.text}</span>
                </li>
              ))}
            </ul>

            <p className="mt-2 text-[13px] italic text-[#6E6A63]">
              {TABS[active].caption}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
