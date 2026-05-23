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
    "Онлайн резервации по графика, админ панел и публичен сайт за салони. Планове Старт, Standard, Pro и Premium.",
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
    q: "Защо да плащам 19 евро, след като тефтерът ми е безплатен (или има безплатни програми)?",
    a: "Тефтерът не е безплатен. Той ти струва скъпо. Струва ти пропуснати обаждания, докато работиш с клиент. Струва ти хаос, забравени часове и липса на свободно време. 19 евро е по-малко от цената на едно кафе на ден. За тези пари наемаш личен асистент, който работи 24/7, не прави грешки и никога не спи. А „безплатните\" програми? Те обикновено са пълни с реклами и крадат данните на клиентите ти. Дори да работиш сам, твоето време струва пари. Не го подарявай на администрация.",
  },
  {
    q: "Не разбирам от компютри и нямам време за сложни настройки. Ще се справя ли?",
    a: "Ако можеш да качиш снимка в Instagram, значи вече знаеш как да ползваш SalonApp. Не ти трябва нито нов телефон, нито лаптоп – всичко работи перфектно на устройството, което вече е в ръката ти. Настройката отнема точно 15 минути. Да, 15 минути инвестиция днес, които ще ти спестят стотици часове висене на телефона още този месец.",
  },
  {
    q: "Губя ли контрол? Какво става, ако някой се запише в 3 през нощта или види сметките ми?",
    a: "Ти имаш 100% контрол. Никой няма достъп до личната ти информация, оборота или имената на другите клиенти. Клиентите виждат единствено празните кутийки с часове, които ти си позволил да се виждат. Системата няма да позволи записване извън работното ти време. А относно мита, че „клиентките предпочитат да звънят\" – данните показват друго. Над 70% от хората предпочитат да си запазят час с два клика от дивана в 23:00 ч., докато гледат сериал, вместо да се съобразяват кога е удобно да ти звъннат. Дай им тази свобода и графикът ти ще се напълни сам.",
  },
  {
    q: "Какво става, ако реша, че не е за мен и искам да спра?",
    a: "Спираш го с един клик. Точка. Няма скрити договори, няма дребен шрифт, няма такси за прекратяване. Ние не искаме да те държим насила. Искаме да ползваш SalonApp, защото виждаш как ти пести нерви и ти носи повече пари. Ако не го прави – просто си тръгваш без въпроси.",
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
          {/* Tagline вместо лого */}
          <p className="hidden text-right text-[11px] font-bold leading-snug text-[#1A1A1A]/70 sm:block">
            Твоят салон.{" "}
            <span className="text-[#C9A84C]">Твой сайт.</span>{" "}
            Твоя система.
          </p>
        </div>
      </header>

      <main className="pt-[57px]">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#EAD5C4] px-4 pb-12 pt-2 sm:px-6 md:pb-16 md:pt-6">
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

            {/* Ново подзаглавие — по-тъмен цвят, всяко изречение на нов ред */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#1A1A1A]/80 md:text-lg">
              Спри да делиш клиентите си с конкуренцията.
              <br />
              Получи собствен сайт и автоматизирана система за резервации.
              <br />
              <span className="font-semibold">
                Ние изграждаме всичко и настройваме услугите ти вместо теб – напълно безплатно.
              </span>
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#comparison"
                className="btn-pulse inline-flex min-h-[54px] w-full items-center justify-center bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-10 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90 sm:w-auto"
              >
                ЗАЯВИ БЕЗПЛАТНА КОНСУЛТАЦИЯ И САЙТ
              </a>
              <a
                href="#templates"
                className="inline-flex min-h-[54px] w-full items-center justify-center border border-[#1A1A1A]/20 px-10 text-sm font-black uppercase tracking-widest text-[#1A1A1A]/60 transition hover:border-[#C9A84C] hover:text-[#C9A84C] sm:w-auto"
              >
                Виж демо салон
              </a>
            </div>

            {/* Trust items с икони — по-видим текст */}
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-5">
              {[
                { icon: "💳", text: "Без банкова карта при регистрация" },
                { icon: "📄", text: "Без договори" },
                { icon: "✋", text: "Спираш, когато поискаш" },
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A]/70">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 3-те бели кутии */}
          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Стартираш за 24 часа",
                  desc: "Ние изграждаме сайта ти, качваме услугите и настройваме графиците. Ти само приемаш клиенти.",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                },
                {
                  title: "Управлявай от джоба си",
                  desc: "Твоят личен асистент, който работи 24/7. Следи резервации, наличности и приходи с един клик.",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  ),
                },
                {
                  title: "100% Независимост",
                  desc: "Твоите клиенти са си твои. Без комисионни, без реклами на конкуренти и без излишни платформи.",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                },
              ].map((t) => (
                <div
                  key={t.title}
                  className="flex flex-col items-center border border-[#1A1A1A]/8 bg-white p-7 shadow-sm text-center"
                >
                  <span style={{ color: GOLD }}>{t.icon}</span>
                  <p className="mt-3 text-base font-bold text-[#1A1A1A]">{t.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#1A1A1A]/60">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MOCKUP СЕКЦИЯ ── */}
        <section className="bg-[#C9A87A]">
          {/* Desktop mockup — full width, скрит на мобилни */}
          <Image
            src="/mockup-desktop.png"
            alt="SalonApp — твоят професионален сайт и пълен контрол на графика"
            width={1400}
            height={788}
            className="hidden sm:block w-full h-auto"
            priority
          />
          {/* Mobile mockup — full width, скрит на десктоп */}
          <Image
            src="/mockup-mobile.png"
            alt="SalonApp — твоят професионален сайт и пълен контрол на графика"
            width={600}
            height={900}
            className="block sm:hidden w-full h-auto"
            priority
          />
        </section>

        {/* ── TEMPLATES — "Избери своя стил" ── */}
        <TemplatesSection />

        {/* ── PROBLEMS — grid cards ── */}
        <section className="px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C9A84C]">
              Познато ли ти е?
            </p>
            <h2 className="playfair mt-3 mb-2 text-3xl font-black text-[#1A1A1A] md:text-5xl">
              Познато ли ти е това?
            </h2>
            <p className="mb-10 text-base text-[#1A1A1A]/55">
              Създадохме SalonApp, за да върнем контрола в твоите ръце.
            </p>
            <ProblemsSection />
          </div>
        </section>

        {/* ── СРАВНИТЕЛНА ТАБЛИЦА ── */}
        <section id="comparison" className="bg-white px-4 py-10 sm:px-6 md:py-14 scroll-mt-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="playfair mb-12 text-center text-2xl font-black text-[#1A1A1A] md:text-4xl">
              Защо SalonApp е по-добрият избор за твоя бранд?
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#1A1A1A]/8 shadow-sm">
              {/* Header row */}
              <div className="grid grid-cols-3 bg-[#1A1A1A]">
                <div className="px-2 py-3 text-xs font-bold text-white/60 sm:px-6 sm:py-4 sm:text-sm">Какво получаваш?</div>
                <div className="border-l border-white/10 px-2 py-3 text-center text-xs font-bold text-white/60 sm:px-6 sm:py-4 sm:text-sm">
                  Marketplace
                </div>
                <div className="border-l border-white/10 px-2 py-3 text-center text-xs font-bold text-[#C9A84C] sm:px-6 sm:py-4 sm:text-sm">
                  SalonApp
                </div>
              </div>
              {/* Rows */}
              {[
                {
                  feature: "Твой сайт",
                  bad: { icon: "❌", text: "Само профил при тях" },
                  good: { icon: "✅", text: "Модерен собствен сайт" },
                },
                {
                  feature: "Клиенти",
                  bad: { icon: "❌", text: "Рекламират конкуренти" },
                  good: { icon: "✅", text: "Виждат само теб" },
                },
                {
                  feature: "База данни",
                  bad: { icon: "⚠️", text: "Те притежават данните" },
                  good: { icon: "✅", text: "Ти притежаваш базата" },
                },
                {
                  feature: "Настройка",
                  bad: { icon: "❌", text: "Бориш се сам с часове" },
                  good: { icon: "✅", text: "Ние правим всичко" },
                },
                {
                  feature: "Комисионни",
                  bad: { icon: "⚠️", text: "Плащаш за всеки клиент" },
                  good: { icon: "✅", text: "0% комисионна" },
                },
              ].map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white"} border-t border-[#1A1A1A]/6`}
                >
                  <div className="px-2 py-4 text-xs font-bold text-[#1A1A1A] sm:px-6 sm:py-5 sm:text-sm">{row.feature}</div>
                  <div className="border-l border-[#1A1A1A]/6 px-2 py-4 text-center text-xs text-[#1A1A1A]/55 sm:px-6 sm:py-5 sm:text-sm">
                    <div>{row.bad.icon}</div><div>{row.bad.text}</div>
                  </div>
                  <div className="border-l border-[#1A1A1A]/6 px-2 py-4 text-center text-xs font-semibold text-[#1A1A1A] sm:px-6 sm:py-5 sm:text-sm">
                    <div>{row.good.icon}</div><div>{row.good.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA под таблицата */}
            <div className="mt-10 text-center">
              <Link
                href="/get-started"
                className="btn-pulse inline-flex min-h-[54px] items-center justify-center bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-14 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90"
              >
                ЗАЯВИ БЕЗПЛАТНА КОНСУЛТАЦИЯ И САЙТ
              </Link>
              <p className="mt-3 text-xs text-[#1A1A1A]/35">
                Без карта. Без договор. Консултант ще ти се обади в 24 часа.
              </p>
            </div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section className="bg-[#EAD5C4] px-4 py-10 sm:px-6 md:py-14">
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
        <section className="bg-white px-4 py-10 sm:px-6 md:py-14">
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
        <section className="relative overflow-hidden bg-[#1A1A1A] px-4 py-14 sm:px-6 md:py-20">
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
                ЗАЯВИ БЕЗПЛАТНА КОНСУЛТАЦИЯ И САЙТ
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/25 tracking-wide">
              Без карта. Без обвързване. Данните ти остават при теб.
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#EAD5C4]">
        <div className="mx-auto max-w-6xl px-6 py-6 sm:px-8">

          {/* Горна секция: лого + навигация */}
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">

            {/* Ляво: лого */}
            <Image
              src="/logo.png"
              alt="SalonApp"
              width={240}
              height={161}
              className="h-auto w-[200px] object-contain sm:w-[230px]"
            />

            {/* Дясно: социални + линкове */}
            <div className="flex flex-col items-center gap-4 sm:items-end">
              {/* Социални мрежи */}
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/salonappbg"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-8 w-8 items-center justify-center border border-[#1A1A1A]/15 text-[#1A1A1A]/45 transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/salonappbg"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-8 w-8 items-center justify-center border border-[#1A1A1A]/15 text-[#1A1A1A]/45 transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@salonappbg"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="flex h-8 w-8 items-center justify-center border border-[#1A1A1A]/15 text-[#1A1A1A]/45 transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
                  </svg>
                </a>
              </div>

              {/* Телефони */}
              <div className="flex flex-col items-center gap-2 sm:items-end">
                {[
                  { label: "Продажби", phone: "+359889967291", display: "+359 889 967 291" },
                  { label: "Маркетинг & Реклама", phone: "+359897834243", display: "+359 897 834 243" },
                  { label: "Техническа Поддръжка", phone: "+359877874700", display: "+359 877 874 700" },
                ].map(({ label, phone, display }) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="flex flex-col items-center gap-0.5 transition-colors hover:text-[#C9A84C] sm:flex-row sm:items-baseline sm:gap-1.5"
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]/30">
                      {label}
                    </span>
                    <span className="text-[10px] font-black tracking-[0.1em] text-[#1A1A1A]/45">
                      {display}
                    </span>
                  </a>
                ))}
              </div>

              {/* Линкове */}
              <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:justify-end">
                {[
                  { label: "salonapppro@gmail.com", href: "mailto:salonapppro@gmail.com" },
                  { label: "Условия", href: "/legal/terms" },
                  { label: "Поверителност", href: "/legal/privacy" },
                  { label: "Бисквитки", href: "/legal/cookies" },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/45 transition-colors hover:text-[#C9A84C]"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Разделител */}
          <div className="my-5 border-t border-[#1A1A1A]/10" />

          {/* Copyright */}
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]/30">
            © 2026 SalonApp.pro — Всички права запазени.
          </p>

        </div>
      </footer>
    </div>
  );
}
