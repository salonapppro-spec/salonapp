import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Заявката е приета — SalonApp.pro",
  description: "Твоята заявка за безплатен месец е приета успешно. Очаквай обаждане от нас.",
  robots: { index: false, follow: false },
};

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

export default function ThankYouPage() {
  return (
    <div
      className={`${playfair.variable} ${inter.variable} min-h-screen bg-[#F9F5F0] text-[#1A1A1A]`}
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-[rgba(201,168,76,0.2)] bg-[rgba(249,245,240,0.96)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-bold text-[#1A1A1A]/40 transition hover:text-[#C9A84C]">
            ← Начало
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#C9A84C]">
            ✦ SalonApp.pro
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-20 text-center">

        {/* Gold checkmark */}
        <div
          className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
        >
          ✓
        </div>

        {/* Title */}
        <h1
          className="playfair mb-4 text-3xl font-black leading-tight text-[#1A1A1A] md:text-5xl"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Супер! Вече си една крачка пред конкуренцията.
        </h1>

        <p className="mx-auto mb-14 max-w-lg text-base leading-relaxed text-[#1A1A1A]/55 md:text-lg">
          Твоята заявка за безплатен месец и лична настройка е приета успешно.
        </p>

        {/* Divider */}
        <div className="mb-14 flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
          <span style={{ color: GOLD }}>✦</span>
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
        </div>

        {/* Какво следва сега */}
        <div className="mb-14 text-left">
          <h2
            className="playfair mb-8 text-2xl font-black text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Какво следва сега?
          </h2>

          <div className="flex flex-col gap-6">
            {[
              {
                num: "1",
                title: "Обаждане от нас",
                desc: "Наш експерт ще ти се обади в рамките на 24 часа на посочения телефонен номер.",
              },
              {
                num: "2",
                title: "Кратка консултация",
                desc: "Ще обсъдим услугите, които предлагаш, и как искаш да изглежда твоят нов сайт.",
              },
              {
                num: "3",
                title: "Старт на сайта",
                desc: "До 24 часа след разговора сайтът ти ще бъде активен и готов да приема резервации.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-5 rounded-2xl border border-[rgba(201,168,76,0.2)] bg-white p-6 shadow-sm">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
                >
                  {step.num}
                </div>
                <div>
                  <p className="mb-1 text-base font-bold text-[#1A1A1A]">{step.title}</p>
                  <p className="text-sm leading-relaxed text-[#1A1A1A]/55">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex min-h-[54px] items-center justify-center rounded-lg px-12 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
        >
          ← Към началната страница
        </Link>

        {/* Contact */}
        <div className="mt-12 border-t border-[rgba(201,168,76,0.2)] pt-8 text-sm text-[#1A1A1A]/40">
          <p>Ако имаш въпроси:</p>
          <p className="mt-2 flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-4">
            <a href="mailto:salonapppro@gmail.com" className="font-bold text-[#C9A84C] transition hover:underline">
              salonapppro@gmail.com
            </a>
            <span className="hidden sm:inline text-[#1A1A1A]/20">·</span>
            <a href="tel:+359889967291" className="font-bold text-[#C9A84C] transition hover:underline">
              +359 889 967 291
            </a>
          </p>
        </div>
      </main>

      {/* Bottom glow */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, ${ROSE}, transparent)` }}
      />
    </div>
  );
}
