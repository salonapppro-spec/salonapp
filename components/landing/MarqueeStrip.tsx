"use client";

export default function MarqueeStrip() {
  const text =
    "✦ БЕЗПЛАТЕН УЕБ ДИЗАЙН ✦ ДИГИТАЛЕН ГРАФИК 24/7 ✦ БИЗНЕС КАЛКУЛАТОР ✦ СИГУРНОСТ";
  const items = Array(6).fill(text);

  return (
    <div className="overflow-hidden bg-[#C9A84C] py-3">
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="marquee-track flex whitespace-nowrap">
        {items.map((t, i) => (
          <span
            key={i}
            className="mr-12 text-[11px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
