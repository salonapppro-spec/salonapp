import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import FaqAccordion from "@/components/FaqAccordion";
import LandingHeader from "@/components/landing/LandingHeader";
import ProblemsSection from "@/components/landing/ProblemsSection";
import PlansSection from "@/components/landing/PlansSection";
import TemplatesSection from "@/components/landing/TemplatesSection";
import { LP } from "@/components/landing/palette";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import AdminShowcase from "@/components/landing/AdminShowcase";
import GoldDust from "@/components/landing/GoldDust";
import HeroSection from "@/components/landing/HeroSection";

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
    "Онлайн резервации 24/7, собствен уебсайт и админ панел за салони. От €19/месец. Без комисионни. Без договори. Безплатен уеб дизайн от екипа.",
  alternates: {
    canonical: "https://salonapp.pro",
  },
  openGraph: {
    title: "SalonApp.pro — Сайт, резервации и бизнес за салони",
    description:
      "Онлайн резервации 24/7, собствен уебсайт и админ панел за салони. От €19/месец. Без комисионни. Безплатен уеб дизайн.",
    url: "https://salonapp.pro",
    siteName: "SalonApp.pro",
    locale: "bg_BG",
    type: "website",
    images: [
      {
        url: "https://salonapp.pro/hero-mockup-clean.webp",
        width: 1200,
        height: 630,
        alt: "SalonApp.pro — платформа за салони за красота",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SalonApp.pro — Сайт и резервации за салони",
    description:
      "Онлайн резервации 24/7, собствен уебсайт и админ панел. От €19/месец.",
    images: ["https://salonapp.pro/hero-mockup-clean.webp"],
  },
};

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

// ── JSON-LD Schemas ────────────────────────────────────────────────────────────
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SalonApp.pro",
  url: "https://salonapp.pro",
  logo: "https://salonapp.pro/logo.png",
  description:
    "Мулти-тенант SaaS платформа за управление на салони за красота — онлайн резервации, собствен уебсайт и административен панел.",
  sameAs: [
    "https://www.instagram.com/salonappbg",
    "https://www.facebook.com/salonappbg",
    "https://www.tiktok.com/@salonappbg",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+359889967291",
      contactType: "sales",
      availableLanguage: "Bulgarian",
    },
  ],
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SalonApp.pro",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://salonapp.pro",
  description:
    "Платформа за онлайн резервации и управление на салони за красота. Собствен уебсайт, клиентска база и финансови отчети.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "19",
    highPrice: "99",
    priceCurrency: "EUR",
    offerCount: 4,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

export default function Home() {
  return (
    <div
      className={`${playfair.variable} ${inter.variable} min-h-screen bg-[#F8EBDD] text-[#181818]`}
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(199,154,75,0.35); }
          50%       { box-shadow: 0 0 28px 8px rgba(199,154,75,0.15); }
        }
        @keyframes float-mockup {
          0%, 100% { transform: translateY(calc(-50% + 0px)) rotateY(0deg); }
          50%       { transform: translateY(calc(-50% - 12px)) rotateY(0deg); }
        }
        @keyframes in-right {
          from { opacity: 0; transform: translateY(-50%) translateX(80px) rotateY(-14deg) scale(0.95); }
          60%  { opacity: 1; }
          to   { opacity: 1; transform: translateY(-50%) translateX(0px) rotateY(0deg) scale(1); }
        }
        .mockup-float {
          animation: in-right 1.2s cubic-bezier(0.16,0.85,0.25,1) 0.2s forwards,
                     float-mockup 7s ease-in-out 1.5s infinite;
        }
        @keyframes badge-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        .badge-in { animation: badge-in 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .btn-pulse { animation: pulse-gold 2.8s ease-in-out infinite; }
        .playfair  { font-family: var(--font-playfair), Georgia, serif; }
        html, body { background-color: #F8EBDD; color-scheme: only light; }
      `}</style>

      {/* ── JSON-LD Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <LandingHeader />

      <main className="pt-[57px]">

        {/* ── HERO ── */}
        <GoldDust count={35} />
        <HeroSection />

        {/* ── FEATURES GRID ── */}
        <section id="features" className="bg-white px-8 py-12 lg:px-16 md:py-16 scroll-mt-16">
          <div>
            <h2 className="playfair mb-10 text-center text-3xl font-bold text-[#3D1F0A] md:text-4xl">
              Всичко, от което се нуждае твоят салон
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
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
                  title: "Имейл напомняния",
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
              ].map((f, i) => (
                <RevealOnScroll key={f.title} delay={i * 80} className="flex flex-col items-center text-center">
                  <span style={{ color: "#C79A4B" }}>{f.icon}</span>
                  <p className="mt-3 text-sm font-bold text-[#181818]">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6E6A63]">{f.desc}</p>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── ADMIN SHOWCASE ── */}
        <RevealOnScroll><AdminShowcase /></RevealOnScroll>

        {/* ── TEMPLATES — "Избери своя стил" ── */}
        <div id="demo"><RevealOnScroll><TemplatesSection /></RevealOnScroll></div>

        {/* ── PROBLEMS — grid cards ── */}
        <section className="px-8 py-10 lg:px-16 md:py-14">
          <div>
            <RevealOnScroll>
              <h2 className="playfair mt-3 mb-2 text-3xl font-bold text-[#3D1F0A] md:text-5xl">
                Познато ли ти е това?
              </h2>
              <p className="mb-10 text-base text-[#6E6A63]">
                Създадохме SalonApp, за да върнем контрола в твоите ръце.
              </p>
            </RevealOnScroll>
            <ProblemsSection />
          </div>
        </section>

        {/* ── СРАВНЕНИЕ ── */}
        <section id="comparison" className="bg-[#F8EBDD] px-5 py-14 scroll-mt-16 sm:px-8 lg:px-16">
          <RevealOnScroll>
            <h2 className="playfair mb-10 text-center text-3xl font-bold text-[#3D1F0A] md:text-4xl">
              Защо SalonApp е по-добрият избор за твоя бранд?
            </h2>

            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#E2D4C3] shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-[#1E1209] text-sm font-semibold">
                <div className="px-3 py-3 text-[11px] text-[#9A8F85] sm:px-5 sm:py-4 sm:text-sm">Какво получаваш?</div>
                <div className="border-l border-white/10 px-2 py-3 text-center text-[11px] text-white/80 sm:px-5 sm:py-4 sm:text-sm">Marketplace</div>
                <div className="border-l border-white/10 px-2 py-3 text-center text-[11px] font-bold text-[#C79A4B] sm:px-5 sm:py-4 sm:text-sm">SalonApp</div>
              </div>

              {/* Rows */}
              {[
                {
                  feature: "Твой сайт",
                  bad: { icon: "❌", text: "Само профил при тях" },
                  good: { text: "Собствен сайт" },
                },
                {
                  feature: "Клиенти",
                  bad: { icon: "❌", text: "Рекламират конкуренти" },
                  good: { text: "Виждат само теб" },
                },
                {
                  feature: "База данни",
                  bad: { icon: "⚠️", text: "Те притежават данните" },
                  good: { text: "Ти притежаваш базата" },
                },
                {
                  feature: "Настройка",
                  bad: { icon: "❌", text: "Бориш се сам" },
                  good: { text: "Ние правим всичко" },
                },
                {
                  feature: "Комисионни",
                  bad: { icon: "⚠️", text: "Плащаш за всеки" },
                  good: { text: "0% комисионна" },
                },
              ].map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1.1fr_1fr_1fr] border-t border-[#E2D4C3] text-sm ${i % 2 === 0 ? "bg-white" : "bg-[#FDF7F2]"}`}
                >
                  <div className="px-3 py-3 text-[12px] font-bold text-[#3D1F0A] sm:px-5 sm:py-5 sm:text-sm">{row.feature}</div>
                  <div className="flex flex-col items-center justify-center gap-1 border-l border-[#E2D4C3] px-2 py-3 text-center text-[#9A8F85] sm:px-4 sm:py-5">
                    <span className="text-base leading-none sm:text-lg">{row.bad.icon}</span>
                    <span className="text-[10px] leading-tight sm:text-xs">{row.bad.text}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 border-l border-[#E2D4C3] px-2 py-3 text-center sm:px-4 sm:py-5">
                    <span className="text-base leading-none sm:text-lg">✅</span>
                    <span className="text-[10px] font-bold leading-tight text-[#3D1F0A] sm:text-xs">{row.good.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/get-started"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#C79A4B] px-10 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#A6823A]"
              >
                Заяви безплатна консултация и сайт
              </Link>
            </div>
          </RevealOnScroll>
        </section>
        {/* ── PLANS ── */}
        <section className="bg-[#F8EBDD] px-8 py-10 lg:px-16 md:py-14">
          <div>
            <div className="border-b border-[#E8DDD0] pb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#C79A4B]">
                Планове и цени
              </p>
              <h2
                className="playfair mt-3 text-3xl font-bold text-[#3D1F0A] md:text-5xl"
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
        <div className="h-px bg-[#C79A4B]/20" />

        {/* ── FAQ ── */}
        <section className="bg-[#F8EBDD] px-8 py-10 lg:px-16 md:py-14">
          <div>
            <div className="mb-10 border-b border-[#E8DDD0] pb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#C79A4B]">
                Въпроси
              </p>
              <h2
                className="playfair mt-3 text-3xl font-bold text-[#3D1F0A] md:text-5xl"
              >
                Знаем какво си помисли вече.
              </h2>
            </div>
            <FaqAccordion items={faqs} />
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="relative overflow-hidden bg-[#3D1F0A] px-4 py-14 sm:px-6 md:py-20">
          <GoldDust count={50} />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            style={{ background: LP.accent, opacity: 0.08 }}
          />
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#C79A4B]">
              Започни сега
            </p>
            <h2
              className="playfair mt-5 text-4xl font-bold leading-tight text-white md:text-6xl"
            >
              Остави тефтера в миналото.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/40">
              Попълни формата сега. Ние ще ти се обадим и до 24 часа ще имаш готов, работещ сайт.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/get-started"
                className="btn-pulse inline-flex min-h-[54px] items-center justify-center bg-[linear-gradient(135deg,#C79A4B,#A6823A)] px-14 text-sm font-black uppercase tracking-widest text-white transition hover:opacity-90"
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
      <footer className="bg-[#F8EBDD]">
        <div className="px-8 py-6 lg:px-16">

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
                  className="flex h-8 w-8 items-center justify-center border border-[#E8DDD0] text-[#6E6A63] transition-colors hover:border-[#C79A4B] hover:text-[#C79A4B]"
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
                  className="flex h-8 w-8 items-center justify-center border border-[#E8DDD0] text-[#6E6A63] transition-colors hover:border-[#C79A4B] hover:text-[#C79A4B]"
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
                  className="flex h-8 w-8 items-center justify-center border border-[#E8DDD0] text-[#6E6A63] transition-colors hover:border-[#C79A4B] hover:text-[#C79A4B]"
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
                    className="flex flex-col items-center gap-0.5 transition-colors hover:text-[#C79A4B] sm:flex-row sm:items-baseline sm:gap-1.5"
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
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6E6A63] transition-colors hover:text-[#C79A4B]"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Разделител */}
          <div className="my-5 border-t border-[#E8DDD0]" />

          {/* Copyright */}
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6E6A63]/60">
            © 2026 SalonApp.pro — Всички права запазени.
          </p>

        </div>
      </footer>
    </div>
  );
}
