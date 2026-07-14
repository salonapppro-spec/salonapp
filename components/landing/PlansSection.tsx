"use client";

import Link from "next/link";
import { LP, LP_GRADIENT } from "@/components/landing/palette";

const plans = [
  {
    name: "СТАРТ",
    price: "15",
    featured: false,
    features: [
      "Твой собствен сайт (Субдомейн)",
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
      "Имейл след посещение за събиране на отзиви (Google/Facebook)",
      "Google Бизнес акаунт настройка",
      "SEO и AIO (AI Оптимизация)",
    ],
  },
  {
    name: "ПРЕМИУМ",
    price: "49",
    featured: false,
    features: [
      "До 3 специалиста — отделни админ панели и графици, общ сайт",
      "Всичко от ПРО плана",
      "Автоматични SMS & Viber напомняния",
    ],
  },
];

export default function PlansSection() {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className="relative flex flex-col border border-[#E7DDD0] bg-[#FDFBF8] p-7 shadow-sm transition-shadow hover:shadow-lg"
          style={plan.featured ? { borderTop: `3px solid ${LP.accent}` } : {}}
        >
          {plan.tag && (
            <div
              className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
              style={{ background: LP_GRADIENT }}
            >
              {plan.tag}
            </div>
          )}

          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6E6A63]">
            {plan.name}
          </div>

          <div
            className="mt-3 text-5xl font-black leading-none"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: plan.featured ? LP.accent : LP.text,
            }}
          >
            {plan.price}€
          </div>
          <div className="mt-1 text-xs text-[#6E6A63] tracking-widest">/ месец</div>

          <div className="my-5 h-px bg-[#E7DDD0]" />

          <ul className="flex-1 space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-[#6E6A63]">
                <span
                  className="mt-2 h-[2px] w-4 shrink-0"
                  style={{ background: LP.accentDark }}
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
                    background: LP_GRADIENT,
                    color: "white",
                  }
                : {
                    border: `1px solid ${LP.border}`,
                    color: LP.text,
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
