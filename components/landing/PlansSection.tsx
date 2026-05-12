"use client";

import Link from "next/link";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

const plans = [
  {
    name: "СТАРТ",
    price: "15",
    featured: false,
    features: [
      "Твой собствен сайт",
      "SEO оптимизация",
      "Google Бизнес профил настройка",
    ],
  },
  {
    name: "СТАНДАРТ",
    price: "19",
    featured: false,
    features: [
      "1 Специалист",
      "Твой собствен сайт (Субдомейн)",
      "Дигитален график",
      "Онлайн резервации 24/7",
      "Бизнес Калкулатор и Месечни отчети",
    ],
  },
  {
    name: "ПРО",
    price: "29",
    featured: true,
    tag: "Най-избиран",
    features: [
      "1 Специалист",
      "Всичко от СТАНДАРТ плана",
      "Паралелни услуги (двама клиенти едновременно)",
      "Google Бизнес акаунт настройка",
      "SEO и AIO (AI Оптимизация)",
    ],
  },
  {
    name: "ПРЕМИУМ",
    price: "49",
    featured: false,
    features: [
      "1 Специалист",
      "Всичко от ПРО плана",
      "Автоматични SMS & Viber напомняния",
      "Имейл след посещение за събиране на отзиви (Google/Facebook)",
    ],
  },
];

export default function PlansSection() {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className="relative flex flex-col border border-[#1A1A1A]/10 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg"
          style={plan.featured ? { borderTop: `3px solid ${GOLD}` } : {}}
        >
          {plan.tag && (
            <div
              className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
            >
              {plan.tag}
            </div>
          )}

          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40">
            {plan.name}
          </div>

          <div
            className="mt-3 text-5xl font-black leading-none"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: plan.featured ? GOLD : "#1A1A1A",
            }}
          >
            {plan.price}€
          </div>
          <div className="mt-1 text-xs text-[#1A1A1A]/35 tracking-widest">/ месец</div>

          <div className="my-5 h-px bg-[#1A1A1A]/8" />

          <ul className="flex-1 space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-[#1A1A1A]/60">
                <span
                  className="mt-2 h-[2px] w-4 shrink-0"
                  style={{ background: ROSE }}
                />
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/get-started"
            className="mt-8 flex min-h-[44px] w-full items-center justify-center text-xs font-black uppercase tracking-widest transition"
            style={
              plan.featured
                ? {
                    background: `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
                    color: "white",
                  }
                : {
                    border: "1px solid rgba(26,26,26,0.2)",
                    color: "#1A1A1A",
                  }
            }
          >
            Започни Безплатно
          </Link>
        </div>
      ))}
    </div>
  );
}
