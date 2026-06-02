import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import FaqAccordion from "@/components/FaqAccordion";
import ProblemsSection from "@/components/landing/ProblemsSection";
import PlansSection from "@/components/landing/PlansSection";
import TemplatesSection from "@/components/landing/TemplatesSection";
import { LP } from "@/components/landing/palette";

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
      className={`${playfair.variable} ${inter.variable} min-h-screen bg-[#EDE8DF] text-[#1A1A1A]`}
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,160,99,0.35); }
          50%       { box-shadow: 0 0 28px 8px rgba(200,160,99,0.15); }
        }
        .btn-pulse { animation: pulse-gold 2.8s ease-in-out infinite; }
        .playfair  { font-family: var(--font-playfair), Georgia, serif; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#E0D9CF] bg-[#EDE8DF]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="SalonApp" width={120} height={40} className="h-8 w-auto object-contain" />
          </Link>

          {/* Nav links — hidden on mobile */}
          <nav className="hidden items-center gap-7 lg:flex">
            {[
              { label: "ФУНКЦИИ", href: "#features" },
              { label: "ПРИМЕРНИ САЙТОВЕ", href: "#templates" },
              { label: "ЦЕНИ", href: "#plans" },
              { label: "ЗА НАС", href: "#about" },
              { label: "FAQ", href: "#faq" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[11px] font-bold tracking-[0.12em] text-[#6E6A63] transition hover:text-[#1A1A1A]"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden border border-[#1A1A1A] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A] transition hover:bg-[#1A1A1A] hover:text-white sm:inline-flex"
            >
              ВХОД ЗА САЛОНИ
            </Link>
            <Link
              href="/get-started"
              className="bg-[#C8A063] px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#A67C3D]"
            >
              БЕЗПЛАТЕН МЕСЕЦ
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-[57px]">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#EDE8DF] pb-0" style={{ minHeight: "min(100vh - 57px, 820px)" }}>
          {/* Full-width grid: left text has padding, right image bleeds to edge */}
          <div className="grid h-full lg:grid-cols-[45%_55%]" style={{ minHeight: "min(calc(100vh - 57px), 820px)" }}>

            {/* Left — text */}
            <div className="relative z-10 flex flex-col justify-center px-6 pb-10 pt-10 sm:px-10 lg:pl-[max(2rem,calc((100vw-1152px)/2+2rem))] lg:pr-8">
              {/* Pill badge */}
              <div className="mb-6 inline-flex items-center rounded-full border border-[#D8D0C4] bg-[#E8E1D6] px-4 py-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8A063]">
                  Сайт и резервационна система за твоя салон
                </span>
              </div>

              <h1 className="playfair text-5xl font-black leading-[1.08] tracking-tight text-[#1A1A1A] md:text-6xl lg:text-[60px]">
                Твоят салон.<br />
                Твоят сайт.<br />
                Твоята{" "}
                <span style={{ color: "#C8A063" }}>система.</span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-[#6E6A63]">
                Красив сайт, онлайн резервации, график, клиенти и напомняния. Всичко необходимо, за да расте бизнесът ти.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/get-started"
                  className="btn-pulse inline-flex min-h-[52px] items-center justify-center bg-[#C8A063] px-8 text-sm font-black uppercase tracking-widest text-white transition hover:bg-[#A67C3D]"
                >
                  ЗАПОЧНИ БЕЗПЛАТНО →
                </Link>
                <a
                  href="#templates"
                  className="inline-flex min-h-[52px] items-center justify-center border border-[#1A1A1A] px-8 text-sm font-black uppercase tracking-widest text-[#1A1A1A] transition hover:border-[#C8A063] hover:text-[#C8A063]"
                >
                  ВИЖ ДЕМО ▶
                </a>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {["Без договор", "Без банкова карта", "Спираш когато поискаш"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-sm text-[#6E6A63]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A063" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — image bleeds to right edge, aligned to top */}
            <div className="relative hidden self-stretch lg:block">
              <Image
                src="/hero-mockup.png"
                alt="SalonApp — твоят сайт и админ панел"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
            {/* Mobile — image below text, full width */}
            <div className="lg:hidden px-4 pb-6">
              <Image
                src="/hero-mockup.png"
                alt="SalonApp — твоят сайт и админ панел"
                width={800}
                height={600}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </div>

          {/* ── 4 NOTIFICATION CARDS ── */}
          <div className="mx-auto mt-10 max-w-6xl">
            <div className="grid grid-cols-2 gap-3 pb-10 sm:grid-cols-4 sm:pb-12">
              {[
                {
                  color: "#E8725A",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                  title: "Нова резервация",
                  lines: ["Катя Иванова", "Микроблейдинг вежди", "Утре, 11:30"],
                },
                {
                  color: "#5AAD8F",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  ),
                  title: "SMS изпратен",
                  lines: ["Напомняне изпратено", "24 часа предварително"],
                },
                {
                  color: "#5A8FAD",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  ),
                  title: "Приход днес",
                  lines: ["+180 лв.", "4 резервации"],
                },
                {
                  color: "#C8A063",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ),
                  title: "Нов отзив",
                  lines: ["★★★★★", "Мария Георгиева", "Страхотно обслужване!"],
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
                  style={{ border: "1px solid #F0EBE3" }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: card.color, color: "#fff" }}
                  >
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#1A1A1A]">{card.title}</p>
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                    </div>
                    {card.lines.map((l, i) => (
                      <p key={i} className={`text-xs ${i === 0 && card.title === "Приход днес" ? "font-black text-[#1A1A1A] text-base" : "text-[#6E6A63]"}`}>{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ── */}
        <section className="border-y border-[#D8D0C4] bg-[#EDE8DF] px-4 py-8 sm:px-6">
          <p className="mb-6 text-center text-[10px] font-black uppercase tracking-[0.35em] text-[#6E6A63]">
            Доверени от салони в цяла България
          </p>
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { name: "LINDY\nNAILS", sub: "" },
              { name: "The Skin", sub: "КОЗМЕТИКА & ГРИЖА" },
              { name: "THE BEAST", sub: "BARBERSHOP" },
              { name: "EUPHORIA", sub: "BEAUTY STUDIO" },
              { name: "Beauty Room", sub: "BY IVANA" },
              { name: "PAW EMPIRE", sub: "STUDIO" },
            ].map((brand) => (
              <div key={brand.name} className="flex flex-col items-center leading-tight">
                <span className="whitespace-pre-line text-center text-sm font-black uppercase tracking-widest text-[#1A1A1A]">
                  {brand.name}
                </span>
                {brand.sub && (
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6E6A63]">{brand.sub}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section id="features" className="bg-[#EDE8DF] px-4 py-12 sm:px-6 md:py-16 scroll-mt-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="playfair mb-10 text-center text-3xl font-black text-[#1A1A1A] md:text-4xl">
              Всичко, от което се нуждае твоят салон
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {[
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  ),
                  title: "Собствен сайт",
                  desc: "Красив, модерен и оптимизиран за мобилни устройства.",
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                  title: "Онлайн резервации",
                  desc: "Клиентите запазват час 24/7, без да ти звънят и пишат.",
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  title: "Клиентска база",
                  desc: "Всички клиенти и история на посещенията на едно място.",
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  ),
                  title: "SMS напомняния",
                  desc: "Автоматични напомняния 24ч преди всеки час.",
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  ),
                  title: "Финанси и отчети",
                  desc: "Следи приходи, разходи и растежа на бизнеса си.",
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
                    </svg>
                  ),
                  title: "Лесно управление",
                  desc: "Интуитивен панел, създаден специално за бизнеса са салони.",
                },
              ].map((f) => (
                <div key={f.title} className="flex flex-col items-center text-center">
                  <span style={{ color: "#C8A063" }}>{f.icon}</span>
                  <p className="mt-3 text-sm font-bold text-[#1A1A1A]">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6E6A63]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEMPLATES — "Избери своя стил" ── */}
        <TemplatesSection />

        {/* ── PROBLEMS — grid cards ── */}
        <section className="px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C8A063]">
              Познато ли ти е?
            </p>
            <h2 className="playfair mt-3 mb-2 text-3xl font-black text-[#1A1A1A] md:text-5xl">
              Познато ли ти е това?
            </h2>
            <p className="mb-10 text-base text-[#6E6A63]">
              Създадохме SalonApp, за да върнем контрола в твоите ръце.
            </p>
            <ProblemsSection />
          </div>
        </section>

        {/* ── СРАВНИТЕЛНА ТАБЛИЦА ── */}
        <section id="comparison" className="bg-[#EDE8DF] px-4 py-10 sm:px-6 md:py-14 scroll-mt-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="playfair mb-12 text-center text-2xl font-black text-[#1A1A1A] md:text-4xl">
              Защо SalonApp е по-добрият избор за твоя бранд?
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#D8D0C4] shadow-sm">
              {/* Header row */}
              <div className="grid grid-cols-3 bg-[#1A1A1A]">
                <div className="px-2 py-3 text-xs font-bold text-white/60 sm:px-6 sm:py-4 sm:text-sm">Какво получаваш?</div>
                <div className="border-l border-white/10 px-2 py-3 text-center text-xs font-bold text-white/60 sm:px-6 sm:py-4 sm:text-sm">
                  Marketplace
                </div>
                <div className="border-l border-white/10 px-2 py-3 text-center text-xs font-bold text-[#C8A063] sm:px-6 sm:py-4 sm:text-sm">
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
                  className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-[#EDE8DF]" : "bg-[#EDE8DF]"} border-t border-[#D8D0C4]`}
                >
                  <div className="px-2 py-4 text-xs font-bold text-[#1A1A1A] sm:px-6 sm:py-5 sm:text-sm">{row.feature}</div>
                  <div className="border-l border-[#D8D0C4] px-2 py-4 text-center text-xs text-[#6E6A63] sm:px-6 sm:py-5 sm:text-sm">
                    <div>{row.bad.icon}</div><div>{row.bad.text}</div>
                  </div>
                  <div className="border-l border-[#D8D0C4] px-2 py-4 text-center text-xs font-semibold text-[#1A1A1A] sm:px-6 sm:py-5 sm:text-sm">
                    <div>{row.good.icon}</div><div>{row.good.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA под таблицата */}
            <div className="mt-10 text-center">
              <Link
                href="/get-started"
                className="btn-pulse inline-flex min-h-[54px] items-center justify-center bg-[linear-gradient(135deg,#C8A063,#A67C3D)] px-14 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90"
              >
                ЗАЯВИ БЕЗПЛАТНА КОНСУЛТАЦИЯ И САЙТ
              </Link>
              <p className="mt-3 text-xs text-[#6E6A63]">
                Без карта. Без договор. Консултант ще ти се обади в 24 часа.
              </p>
            </div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section className="bg-[#EDE8DF] px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="border-b border-[#D8D0C4] pb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C8A063]">
                Планове и цени
              </p>
              <h2
                className="playfair mt-3 text-3xl font-black text-[#1A1A1A] md:text-5xl"
              >
                Избери план. Смени го или го спри, когато поискаш.
              </h2>
              <p className="mt-3 text-sm text-[#6E6A63]">
                Всички планове включват безплатен уеб дизайн от нас и 1 месец напълно безплатно.
              </p>
            </div>
            <PlansSection />
          </div>
        </section>

        {/* ── THIN DIVIDER ── */}
        <div className="h-px bg-[#C8A063]/20" />

        {/* ── FAQ ── */}
        <section className="bg-[#EDE8DF] px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 border-b border-[#D8D0C4] pb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C8A063]">
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
            style={{ background: LP.accent, opacity: 0.08 }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C8A063]">
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
                className="btn-pulse inline-flex min-h-[54px] items-center justify-center bg-[linear-gradient(135deg,#C8A063,#A67C3D)] px-14 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90"
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
      <footer className="bg-[#EDE8DF]">
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
                  className="flex h-8 w-8 items-center justify-center border border-[#D8D0C4] text-[#6E6A63] transition-colors hover:border-[#C8A063] hover:text-[#C8A063]"
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
                  className="flex h-8 w-8 items-center justify-center border border-[#D8D0C4] text-[#6E6A63] transition-colors hover:border-[#C8A063] hover:text-[#C8A063]"
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
                  className="flex h-8 w-8 items-center justify-center border border-[#D8D0C4] text-[#6E6A63] transition-colors hover:border-[#C8A063] hover:text-[#C8A063]"
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
                    className="flex flex-col items-center gap-0.5 transition-colors hover:text-[#C8A063] sm:flex-row sm:items-baseline sm:gap-1.5"
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#6E6A63]/60">
                      {label}
                    </span>
                    <span className="text-[10px] font-black tracking-[0.1em] text-[#6E6A63]">
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
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6E6A63] transition-colors hover:text-[#C8A063]"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Разделител */}
          <div className="my-5 border-t border-[#D8D0C4]" />

          {/* Copyright */}
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6E6A63]/60">
            © 2026 SalonApp.pro — Всички права запазени.
          </p>

        </div>
      </footer>
    </div>
  );
}
