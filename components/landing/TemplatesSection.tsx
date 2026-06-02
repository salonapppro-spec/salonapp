"use client";

import { useState, useEffect, useRef } from "react";

const CLIENTS = [
  { slug: "lindynails", name: "Lindy Nails", type: "Нокти & Маникюр", url: "https://lindynails.salonapp.pro", accent: "#C8826A", img: "/previews/lindynails.jpg" },
  { slug: "theskin", name: "The Skin", type: "Козметика & Грижа за кожата", url: "https://theskin.salonapp.pro", accent: "#C79A4B", img: "/previews/theskin.jpg" },
  { slug: "thebeast", name: "The Beast", type: "Барбершоп", url: "https://thebeast.salonapp.pro", accent: "#C79A4B", img: "/previews/thebeast.jpg" },
  { slug: "magnetic-eyes", name: "Magnetic Eyes", type: "Мигли, Вежди & Перманентен грим", url: "https://magnetic-eyes.salonapp.pro", accent: "#E8A0B4", img: "/previews/magnetic-eyes.jpg" },
  { slug: "euphoria", name: "Euphoria", type: "Фризьорски салон", url: "https://euphoria.salonapp.pro", accent: "#5A8A5E", img: "/previews/euphoria.jpg" },
  { slug: "paw-empire", name: "Paw Empire", type: "Pet Grooming", url: "https://paw-empire.salonapp.pro", accent: "#4A7AB5", img: "/previews/paw-empire.jpg" },
];

// Card dimensions
const BIG_W = 480;
const BIG_H = 360;
const SM_W  = 320;
const SM_H  = 240;

const POSITIONS = [
  { offset: -2, scale: 0.78, z: 0, opacity: 0.4,  tx: "-178%" },
  { offset: -1, scale: 0.88, z: 1, opacity: 0.72, tx: "-97%"  },
  { offset:  0, scale: 1,    z: 2, opacity: 1,    tx: "0%"    },
  { offset:  1, scale: 0.88, z: 1, opacity: 0.72, tx: "97%"   },
  { offset:  2, scale: 0.78, z: 0, opacity: 0.4,  tx: "178%"  },
];

function SiteCard({ client, isActive }: { client: typeof CLIENTS[0]; isActive: boolean }) {
  const w = isActive ? BIG_W : SM_W;
  const h = isActive ? BIG_H : SM_H;
  const scale = w / 1440;

  return (
    <div style={{ width: w, height: h + 56, borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: isActive ? "0 24px 60px rgba(80,40,10,0.18)" : "0 6px 20px rgba(80,40,10,0.08)" }}>
      {/* Browser chrome */}
      <div style={{ height: 36, background: "#f0ece6", borderBottom: "1px solid #e4ddd3", display: "flex", alignItems: "center", gap: 6, padding: "0 12px" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
        <div style={{ flex: 1, marginLeft: 8, height: 20, borderRadius: 4, background: "#e4ddd3", display: "flex", alignItems: "center", padding: "0 8px" }}>
          <span style={{ fontSize: 9, color: "#9a9080", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{client.url.replace("https://", "")}</span>
        </div>
      </div>

      {/* Site preview — static screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div style={{ width: w, height: h, overflow: "hidden", position: "relative", background: "#faf7f2" }}>
        <img
          src={client.img}
          alt={client.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
        />
      </div>

      {/* Label bar */}
      <div style={{ height: 20, background: "#f0ece6", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#3D1F0A", letterSpacing: "0.05em" }}>{client.name}</span>
        <span style={{ fontSize: 9, color: client.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{client.type}</span>
      </div>
    </div>
  );
}

export default function TemplatesSection() {
  const [active, setActive] = useState(0);
  const n = CLIENTS.length;

  const prev = () => setActive((a) => (a - 1 + n) % n);
  const next = () => setActive((a) => (a + 1) % n);
  const paused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setActive((a) => (a + 1) % n);
    }, 3500);
    return () => clearInterval(id);
  }, [n]);

  return (
    <section id="templates" className="bg-[#FFFCF8] px-8 py-10 lg:px-16 md:py-14">

      {/* Header */}
      <div className="mb-12">
        <h2
          className="mt-3 text-3xl font-black text-[#3D1F0A] md:text-5xl"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Ти избираш стила.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[#6E6A63]">
          Всеки салон получава уникален дизайн, изграден специално за него.
        </p>
      </div>

      {/* Desktop Carousel */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{ height: BIG_H + 56 + 40 }}
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        {POSITIONS.map(({ offset, scale, z, opacity, tx }) => {
          const c = CLIENTS[(active + offset + n) % n];
          const isActive = offset === 0;
          return (
            <div
              key={offset}
              onClick={() => isActive
                ? window.open(c.url, "_blank", "noopener,noreferrer")
                : (offset < 0 ? prev() : next())
              }
              style={{
                position: "absolute",
                left: "50%",
                top: 20,
                transform: `translateX(calc(-50% + ${tx})) scale(${scale})`,
                transformOrigin: "top center",
                zIndex: z,
                opacity,
                transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
                cursor: "pointer",
              }}
            >
              <SiteCard client={c} isActive={isActive} />
            </div>
          );
        })}
      </div>

      {/* Mobile Carousel — single card, full width */}
      <div className="lg:hidden">
        <div
          className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer"
          style={{ aspectRatio: "4/3" }}
          onClick={() => window.open(CLIENTS[active].url, "_blank", "noopener,noreferrer")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CLIENTS[active].img}
            alt={CLIENTS[active].name}
            className="w-full h-full object-cover object-top transition-all duration-500"
          />
          {/* Overlay label */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3"
            style={{ background: "rgba(248,235,221,0.92)", backdropFilter: "blur(8px)" }}>
            <span className="text-sm font-bold text-[#3D1F0A]">{CLIENTS[active].name}</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: CLIENTS[active].accent }}>{CLIENTS[active].type}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <button onClick={prev} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DDD0] bg-white text-[#3D1F0A] transition hover:border-[#C79A4B] hover:text-[#C79A4B]" aria-label="Предишен">←</button>
        <div className="flex gap-2">
          {CLIENTS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 999, background: i === active ? "#C79A4B" : "#E8DDD0", transition: "all 0.3s" }} aria-label={`Слайд ${i + 1}`} />
          ))}
        </div>
        <button onClick={next} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DDD0] bg-white text-[#3D1F0A] transition hover:border-[#C79A4B] hover:text-[#C79A4B]" aria-label="Следващ">→</button>
      </div>


    </section>
  );
}
