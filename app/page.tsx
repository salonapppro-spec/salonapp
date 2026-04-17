import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import FaqAccordion from "@/components/FaqAccordion";
import ProblemsSection from "@/components/landing/ProblemsSection";
import PlansSection from "@/components/landing/PlansSection";
import TemplatesSection from "@/components/landing/TemplatesSection";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SalonApp.pro — Сайт, резервации и бизнес за салони",
  description:
    "Онлайн резервации по графика, админ панел и публичен сайт за салони. Планове Standard, Pro, Premium и Collective.",
  openGraph: {
    title: "SalonApp.pro — Beauty. Business. Elevated.",
    description: "Сайт и резервации за салони — без хаоса в чатовете.",
    url: "https://salonapp.pro",
    siteName: "SalonApp.pro",
    locale: "bg_BG",
    type: "website",
  },
};

const GOLD = "#C9A84C";
const ROSE = "#C8826A";
const demoSalonHref = "/lindy-design";

const faqs = [
  {
    q: "Клиентките ми предпочитат да звънят.",
    a: "Нека звънят! Направили сме функция „Бърз час\" специално за теб. Докато си говорите на високоговорител, просто въвеждаш телефона ѝ в твоя екран. Системата сама намира името ѝ и запазваш часа с един клик. Двата календара (твоят и този на сайта) се синхронизират на секундата! Но онлайн сайтът хваща и тези, които се срамуват да звъннат или се сещат късно вечер. Това са нови пари за теб. Освен това, когато се записват сами, ти не спираш работа, за да вдигаш телефона.",
    accent: "phone" as const,
  },
  {
    q: "Сложно е, не разбирам от компютри.",
    a: "Ако знаеш как да влезеш във Facebook, значи знаеш как да ползваш и това. Ние правим уеб дизайна и настройваме всичко безплатно. Ти само гледаш имената на клиентите в телефона си. Просто като детска игра.",
  },
  {
    q: "19 евро са много пари.",
    a: "Един пропуснат час ти струва 50 лева. Нашата система ще спаси поне 2-3 такива часа всеки месец чрез автоматичните напомняния. Тя не ти харчи пари, тя ти изкарва пари.",
  },
  {
    q: "Ами ако реша да спра?",
    a: "Спираш веднага. Няма договори, няма скрити такси. Твоите клиенти са си твои – можеш да изтеглиш списъка с телефоните им по всяко време.",
  },
  {
    q: "Имам си тефтер, той ми е безплатен.",
    a: "Тефтерът не праща съобщения на клиентите и не ти казва кога работиш на загуба. Тефтерът е просто хартия, а SalonApp е твоят личен асистент.",
  },
  {
    q: "Трябва ли ми нов телефон или лаптоп?",
    a: "Не. Всичко работи перфектно на телефона, който ползваш в момента. Не ти трябва нищо друго.",
  },
  {
    q: "Нямам време да го настройвам.",
    a: "Ти не правиш нищо. Пращаш ни ценоразписа си и ние го качваме вместо теб за 24 часа. Влизаш на готово.",
  },
  {
    q: "Клиентите ще ми видят сметките.",
    a: "Абсурд! Бизнес Калкулаторът е скрит и е само за твоите очи. Клиентите виждат само красивото меню с услуги и цени.",
  },
  {
    q: "Има безплатни програми.",
    a: "Безплатните програми са пълни с реклами на твоите конкуренти. Ние ти даваме чисто, професионално място, където съществуваш само ТИ.",
  },
  {
    q: "Ами ако някой се запише в час, в който не работя?",
    a: "Ти определяш работното си време. Ако решиш, че днес почиваш, просто цъкаш един бутон и никой не може да се запише. Ти си шефът.",
  },
  {
    q: "Аз съм само един човек, не ми трябва софтуер.",
    a: "Точно защото си сама, времето ти е най-ценно. Софтуерът ти пести по 10 часа на месец от писане на съобщения. Това са 10 часа почивка за теб.",
  },
];

export default function Home() {
  return (
    <div
      className={`${playfair.variable} ${inter.variable} min-h-screen bg-[#EAD5C4] text-[#1A1A1A]`}
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.35); }
          50%       { box-shadow: 0 0 28px 8px rgba(201,168,76,0.15); }
        }
        .btn-pulse { animation: pulse-gold 2.8s ease-in-out infinite; }
        .playfair  { font-family: var(--font-playfair), Georgia, serif; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#1A1A1A]/8 bg-[#EAD5C4]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/get-started"
            className="border border-[#C9A84C] px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A84C] transition hover:bg-[#C9A84C] hover:text-white"
          >
            БЕЗПЛАТЕН МЕСЕЦ
          </Link>
          <Image
            src="/logo.png"
            alt="SalonApp"
            width={120}
            height={80}
            className="h-10 w-auto object-contain"
          />
        </div>
      </header>

      <main className="pt-[57px]">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#EAD5C4] px-4 pb-20 pt-2 sm:px-6 md:pb-28 md:pt-6">
          {/* Giant decorative text behind */}
          <span
            className="pointer-events-none absolute -right-8 top-8 select-none text-[18vw] font-black leading-none text-[#1A1A1A]/[0.025] md:text-[14vw]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            SA
          </span>

          <div className="relative mx-auto max-w-3xl text-center">
            {/* Logo — large hero banner */}
            <div className="mx-auto mb-6 w-full max-w-[340px]">
              <Image
                src="/logo.png"
                alt="SalonApp"
                width={380}
                height={253}
                className="h-auto w-full object-contain"
                priority
              />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#1A1A1A]/40">
              salonapp.pro — за красота и успех
            </p>

            <h1
              className="playfair mt-5 text-4xl font-black leading-tight tracking-tight text-[#1A1A1A] md:text-6xl lg:text-7xl"
            >
              Твоят бизнес заслужава
              <br />
              <span
                style={{
                  background: `linear-gradient(120deg, ${GOLD} 0%, ${ROSE} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                повече от тефтер.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#1A1A1A]/55 md:text-lg">
              Пълно е с работа, но накрая на месеца не знаеш къде са парите? Спри да губиш
              време в писане на съобщения. Вземи сайт, който записва клиенти сам и ти казва
              колко точно печелиш. Уеб дизайнът и пълната настройка са безплатни от нас.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/get-started"
                className="btn-pulse inline-flex min-h-[54px] w-full items-center justify-center bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-10 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90 sm:w-auto"
              >
                Искам Безплатен Месец
              </Link>
              <Link
                href={demoSalonHref}
                className="inline-flex min-h-[54px] w-full items-center justify-center border border-[#1A1A1A]/20 px-10 text-sm font-black uppercase tracking-widest text-[#1A1A1A]/60 transition hover:border-[#C9A84C] hover:text-[#C9A84C] sm:w-auto"
              >
                Виж демо салон
              </Link>
            </div>

            <p className="mt-5 text-xs text-[#1A1A1A]/35 tracking-wide">
              Без банкова карта при регистрация. Без договори. Спираш, когато поискаш.
            </p>
          </div>

          {/* Trust strip — overlaps below hero */}
          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Готов сайт за 24 часа — Ти не пипаш нищо",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                },
                {
                  label: "Работи перфектно на твоя телефон",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  ),
                },
                {
                  label: "Данните и клиентите са 100% твоя собственост",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex flex-col items-center border border-[#1A1A1A]/8 bg-white p-7 shadow-sm text-center"
                >
                  <span style={{ color: GOLD }}>{t.icon}</span>
                  <p className="mt-4 text-sm font-medium text-[#1A1A1A]/65">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEMPLATES — "Избери своя стил" ── */}
        <TemplatesSection />

        {/* ── PROBLEMS — alternating image/text ── */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C9A84C]">
              Решения
            </p>
            <h2
              className="playfair mt-3 text-3xl font-black text-[#1A1A1A] md:text-5xl"
            >
              Проблемите, които решаваме.
            </h2>
          </div>
          <ProblemsSection />
        </section>

        {/* ── PLANS ── */}
        <section className="bg-[#EAD5C4] px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="border-b border-[#1A1A1A]/10 pb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C9A84C]">
                Планове и цени
              </p>
              <h2
                className="playfair mt-3 text-3xl font-black text-[#1A1A1A] md:text-5xl"
              >
                Избери план. Смени го или го спри, когато поискаш.
              </h2>
              <p className="mt-3 text-sm text-[#1A1A1A]/45">
                Всички планове включват безплатен уеб дизайн от нас и 1 месец напълно безплатно.
              </p>
            </div>
            <PlansSection />
          </div>
        </section>

        {/* ── THIN DIVIDER ── */}
        <div className="h-px bg-[#C9A84C]/20" />

        {/* ── FAQ ── */}
        <section className="bg-white px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 border-b border-[#1A1A1A]/10 pb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C9A84C]">
                Въпроси
              </p>
              <h2
                className="playfair mt-3 text-3xl font-black text-[#1A1A1A] md:text-5xl"
              >
                Знаем какво си помисли вече.
              </h2>
            </div>
            <FaqAccordion items={faqs} />
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="relative overflow-hidden bg-[#1A1A1A] px-4 py-20 sm:px-6 md:py-28">
          {/* Decorative background glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            style={{ background: GOLD, opacity: 0.08 }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C9A84C]">
              Започни сега
            </p>
            <h2
              className="playfair mt-5 text-4xl font-black leading-tight text-white md:text-6xl"
            >
              Остави тефтера в миналото.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/40">
              Попълни формата сега. Ние ще ти се обадим и до 24 часа ще имаш готов, работещ сайт.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/get-started"
                className="btn-pulse inline-flex min-h-[54px] items-center justify-center bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-14 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90"
              >
                Искам Безплатен Месец
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/25 tracking-wide">
              Без карта. Без обвързване. Данните ти остават при теб.
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1A1A1A]/10 bg-[#EAD5C4]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Image
                src="/logo.png"
                alt="SalonApp"
                width={140}
                height={93}
                className="h-auto w-[110px] object-contain"
              />
              <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/35">
                Beauty. Business. Elevated.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/40">
              <Link href="/get-started" className="transition hover:text-[#C9A84C]">
                Безплатен месец
              </Link>
              <Link href={demoSalonHref} className="transition hover:text-[#C9A84C]">
                Демо салон
              </Link>
              <Link href="mailto:salonapppro@gmail.com" className="transition hover:text-[#C9A84C]">
                salonapppro@gmail.com
              </Link>
              <Link href="#" className="transition hover:text-[#C9A84C]">
                Условия
              </Link>
              <Link href="#" className="transition hover:text-[#C9A84C]">
                Поверителност
              </Link>
            </nav>
          </div>
          <div
            className="mt-8 border-t pt-6 text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/25"
            style={{ borderColor: "rgba(26,26,26,0.08)" }}
          >
            © 2026 SalonApp.pro — Всички права запазени.
          </div>
        </div>
      </footer>
    </div>
  );
}
