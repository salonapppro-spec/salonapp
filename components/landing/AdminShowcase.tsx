"use client";

import { useState, useEffect } from "react";

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

  // Auto-rotate
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % TABS.length), 3000);
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

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">

        {/* Screenshot — floating card */}
        <div className="float-phone relative lg:w-[45%]">
          {/* Outer glow */}
          <div
            className="absolute -inset-3 rounded-3xl opacity-40 blur-2xl"
            style={{ background: "radial-gradient(ellipse at center, rgba(199,154,75,0.4), transparent 70%)" }}
          />
          {/* Card */}
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ boxShadow: "0 20px 60px rgba(61,31,10,0.15), 0 0 0 1px rgba(199,154,75,0.2)" }}
          >
            {/* Browser chrome bar */}
            <div
              className="flex items-center gap-2 px-4"
              style={{ height: 40, background: "#f0ece6", borderBottom: "1px solid #e4ddd3" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
              <div
                className="ml-2 flex flex-1 items-center rounded px-3"
                style={{ height: 24, background: "#e4ddd3" }}
              >
                <span style={{ fontSize: 10, color: "#9a9080" }}>salonapp.pro/admin</span>
              </div>
            </div>
            {/* Screenshots crossfade */}
            <div className="relative" style={{ aspectRatio: "9/16", maxHeight: 480 }}>
              {TABS.map((tab, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={tab.key}
                  src={tab.img}
                  alt={tab.label}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
                  style={{ opacity: i === active ? 1 : 0 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right — tabs + features */}
        <div className="flex-1">
          {/* Tabs */}
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

          {/* Caption */}
          <p className="mb-6 text-[15px] leading-relaxed text-[#5A5550]">
            {TABS[active].caption}
          </p>

          {/* Feature list */}
          <ul className="space-y-4">
            {[
              "Работи от всеки телефон — без инсталация",
              "Промени влизат веднага в живо",
              "Всичко на едно място — час, клиент, приход",
              "Ние настройваме всичко вместо теб",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 font-bold text-[#C79A4B]">✓</span>
                <span className="text-sm text-[#5A5550]">{item}</span>
              </li>
            ))}
          </ul>

          {/* Dots */}
          <div className="mt-8 flex gap-2">
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
