"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LandingTracker } from "@/components/marketing/LandingTracker";

type LuxuryLandingPageProps = {
  titleClassName: string;
  bodyClassName: string;
};

type FaqItem = {
  q: string;
  a: string;
  accent?: "phone";
};

const demoSalonHref = "/lindy-design";
const getStartedHref = "/get-started";

const plans = [
  {
    name: "Стандарт",
    price: "19€",
    subtitle: "За самостоятелен старт",
    features: ["1 специалист", "Собствен сайт", "Дигитален график", "Онлайн записване 24/7", "Бизнес калкулатор"],
    featured: false,
  },
  {
    name: "Про",
    price: "29€",
    subtitle: "Най-силният избор за растеж",
    features: ["Всичко от Стандарт", "SEO и AIO", "Паралелни услуги", "По-силен local presence", "По-скъп вид за бранда"],
    featured: true,
  },
  {
    name: "Премиум",
    price: "49€",
    subtitle: "За повече автоматизация",
    features: ["Всичко от Про", "SMS и Viber", "Имейл за отзиви", "По-малко пропуснати часове", "По-добра грижа след посещение"],
    featured: false,
  },
  {
    name: "Колектив",
    price: "49€",
    subtitle: "За екипи и студиа",
    features: ["Неограничен брой специалисти", "Всеки вижда своя график", "Всичко от Про", "Ясно разпределение", "Опция SMS/Viber"],
    featured: false,
  },
];

const faqs: FaqItem[] = [
  {
    q: "Клиентките ми предпочитат да звънят.",
    a: "Нека звънят. Има функция Бърз час. Докато говориш, пишеш телефона. Системата намира клиента и пази часа. Но сайтът хваща и тези, които не искат да звънят или се сещат късно вечер.",
    accent: "phone",
  },
  {
    q: "Сложно е. Не разбирам от компютри.",
    a: "Ние правим тежката част. Ти не строиш сайт. Ти просто ползваш готов инструмент, който е ясен и удобен.",
  },
  {
    q: "19 евро са много пари.",
    a: "Един изпуснат час често струва повече. Ако системата спаси дори малко време и няколко часа на месец, тя вече си се е изплатила.",
  },
  {
    q: "Имам си тефтер. Той ми е безплатен.",
    a: "Тефтерът не праща напомняния, не пази история, не помага за печалбата и не взима часове вместо теб.",
  },
  {
    q: "Нямам време да го настройвам.",
    a: "Точно затова е направено така. Ти пращаш най-важното, а ние подготвяме всичко вместо теб.",
  },
  {
    q: "Ами ако реша да спра?",
    a: "Спираш, когато решиш. Данните и клиентите ти са твои. Няма нужда да се чувстваш заключена.",
  },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function PhoneAccentIcon() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[#F7D58B] shadow-[0_0_30px_rgba(201,168,76,0.22)]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.79.65 2.64a2 2 0 0 1-.45 2.11L8.04 9.73a16 16 0 0 0 6.23 6.23l1.26-1.27a2 2 0 0 1 2.11-.45c.85.31 1.74.53 2.64.65A2 2 0 0 1 22 16.92Z" />
      </svg>
    </span>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LuxuryLandingPage({ titleClassName, bodyClassName }: LuxuryLandingPageProps) {
  const [openFaq, setOpenFaq] = useState(0);
  const [logoSrc, setLogoSrc] = useState("/logo.jpg");

  const orbitTransition = useMemo(
    () => ({
      duration: 18,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const,
    }),
    []
  );

  return (
    <div className={cn("relative isolate overflow-hidden bg-[#060606] text-white", bodyClassName)}>
      <LandingTracker />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
      <motion.div
        className="pointer-events-none absolute -left-24 top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#C9A84C]/20 blur-3xl"
        animate={{ x: [0, 48, 0], y: [0, 24, 0], scale: [1, 1.12, 1] }}
        transition={orbitTransition}
      />
      <motion.div
        className="pointer-events-none absolute right-[-8rem] top-[12rem] h-[26rem] w-[26rem] rounded-full bg-[#C8826A]/20 blur-3xl"
        animate={{ x: [0, -36, 0], y: [0, 36, 0], scale: [1.05, 0.95, 1.05] }}
        transition={{ ...orbitTransition, duration: 21 }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-[#C9A84C]/10 blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -28, 0], scale: [0.95, 1.08, 0.95] }}
        transition={{ ...orbitTransition, duration: 24 }}
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <Link
              href={getStartedHref}
              className="inline-flex items-center rounded-full border border-[#C9A84C]/40 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#F6D98E] shadow-[0_0_40px_rgba(201,168,76,0.12)] transition hover:border-[#C9A84C]/70 hover:bg-[#C9A84C]/10"
            >
              Безплатен месец
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.08 }}>
            <Link href="/" className="flex items-center justify-end">
              <Image
                src={logoSrc}
                alt="SalonApp"
                width={180}
                height={64}
                sizes="(max-width: 1024px) 120px, 180px"
                className="h-12 w-auto rounded-2xl object-contain shadow-[0_0_50px_rgba(255,255,255,0.12)] lg:h-16"
                onError={() => {
                  if (logoSrc !== "/icon.png") setLogoSrc("/icon.png");
                }}
              />
            </Link>
          </motion.div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-24 lg:px-10 lg:py-32">
          <div className="w-full">
            <Reveal>
              <div className="mx-auto max-w-5xl text-center">
                <div className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 backdrop-blur-xl">
                  SalonApp.pro • premium software за beauty бизнес
                </div>

                <h1 className={cn("text-5xl font-extrabold tracking-tighter text-white sm:text-6xl lg:text-7xl xl:text-[6rem]", titleClassName)}>
                  Твоят бизнес заслужава
                  <span className="block bg-gradient-to-r from-white via-[#F6E2A6] to-[#C8826A] bg-clip-text text-transparent">
                    повече от тефтер.
                  </span>
                </h1>

                <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/72 sm:text-xl">
                  Искаш сайт, който изглежда скъпо. Искаш график, който е ясен. Искаш клиенти, които се записват сами. Искаш
                  накрая на месеца да знаеш колко печелиш. Това е SalonApp.
                </p>

                <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <motion.div whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Link
                      href={getStartedHref}
                      className="inline-flex min-w-[240px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-black shadow-[0_25px_80px_rgba(201,168,76,0.28)]"
                    >
                      Искам безплатен месец
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Link
                      href={demoSalonHref}
                      className="inline-flex min-w-[240px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-xl transition hover:border-[#C9A84C]/40 hover:bg-white/10"
                    >
                      Виж демо салон
                    </Link>
                  </motion.div>
                </div>

                <div className="mt-12 grid gap-4 md:grid-cols-3">
                  {[
                    "Готов сайт за 24 часа",
                    "Работи гладко на телефон",
                    "Данните и клиентите са твои",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.7, delay: 0.1 + index * 0.08 }}
                      className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/75 backdrop-blur-xl"
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <Reveal className="mb-12">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs uppercase tracking-[0.32em] text-[#E5C980]">Решения</p>
              <h2 className={cn("text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl", titleClassName)}>
                Четири силни причини да изглеждаш по-скъпо и да работиш по-спокойно.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3 lg:grid-rows-[1.15fr_0.85fr]">
            <Reveal className="lg:col-span-1 lg:row-span-1">
              <motion.div whileHover={{ y: -8 }} className="h-full rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-[#E5C980]">01</p>
                <h3 className={cn("mt-5 text-3xl font-bold tracking-tight text-white", titleClassName)}>Твоята лична витрина</h3>
                <p className="mt-4 text-base leading-8 text-white/72">
                  Вместо да си един профил сред много други, имаш собствен сайт. Клиентката влиза и вижда само теб, твоите снимки, твоите услуги и твоя стил.
                </p>
              </motion.div>
            </Reveal>

            <Reveal className="lg:col-span-2 lg:row-span-1" delay={0.05}>
              <motion.div whileHover={{ y: -8 }} className="h-full rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[#E5C980]">02</p>
                    <h3 className={cn("mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl", titleClassName)}>Дигитален график и секретар 24/7</h3>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-white/72">
                      Клиентите се записват сами. Ако звъннат, ползваш Бърз час. Пишеш телефона и системата помага. Всичко е на едно място и изглежда чисто.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {["10:00", "11:00", "12:30", "14:00"].map((slot, index) => (
                      <div
                        key={slot}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-center text-sm font-semibold",
                          index === 1
                            ? "border-[#C9A84C]/60 bg-[linear-gradient(135deg,rgba(201,168,76,0.22),rgba(200,130,106,0.26))] text-white"
                            : "border-white/10 bg-black/20 text-white/70"
                        )}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Reveal>

            <Reveal className="lg:col-span-1" delay={0.1}>
              <motion.div whileHover={{ y: -8 }} className="h-full rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-[#E5C980]">03</p>
                <h3 className={cn("mt-5 text-3xl font-bold tracking-tight text-white", titleClassName)}>Автоматични напомняния</h3>
                <p className="mt-4 text-base leading-8 text-white/72">
                  Когато клиентката забрави, ти губиш пари. Напомнянията намаляват точно тази болка.
                </p>
              </motion.div>
            </Reveal>

            <Reveal className="lg:col-span-2" delay={0.16}>
              <motion.div whileHover={{ y: -8 }} className="h-full rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-[#E5C980]">04</p>
                <h3 className={cn("mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl", titleClassName)}>Бизнес калкулатор</h3>
                <p className="mt-4 max-w-3xl text-base leading-8 text-white/72">
                  Работиш много, но накрая не знаеш какво реално остава. Системата ти помага да виждаш по-ясно приходи, разходи и истинската картина.
                </p>
              </motion.div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <Reveal className="mb-14 text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.32em] text-[#E5C980]">Планове</p>
            <h2 className={cn("text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl", titleClassName)}>
              Избери план, който ти пасва сега.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/70">
              Изглежда луксозно отвън, но е ясно и лесно отвътре. Плановете са подредени така, че да растеш спокойно.
            </p>
          </Reveal>

          <div className="grid gap-6 xl:grid-cols-4">
            {plans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 0.05}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.01 }}
                  className={cn(
                    "group relative flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition",
                    plan.featured &&
                      "border-[#E5C980]/40 shadow-[0_0_0_1px_rgba(229,201,128,0.12),0_0_90px_rgba(201,168,76,0.22)]"
                  )}
                >
                  {plan.featured ? (
                    <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.22),transparent_55%)]" />
                  ) : null}

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[#E5C980]">{plan.name}</p>
                        <p className="mt-3 text-sm text-white/60">{plan.subtitle}</p>
                      </div>
                      {plan.featured ? (
                        <span className="rounded-full border border-[#E5C980]/30 bg-[#C9A84C]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F5D98C]">
                          Про
                        </span>
                      ) : null}
                    </div>

                    <div className={cn("mt-8 text-5xl font-extrabold tracking-tight text-white", titleClassName)}>{plan.price}</div>
                    <div className="mt-1 text-sm uppercase tracking-[0.22em] text-white/45">на месец</div>

                    <ul className="mt-8 space-y-4 text-sm leading-7 text-white/75">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#E5C980]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="mt-8"
                    >
                      <Link
                        href={getStartedHref}
                        className={cn(
                          "inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] transition",
                          "bg-white/5 text-white ring-1 ring-white/10 backdrop-blur-xl hover:bg-[linear-gradient(135deg,rgba(201,168,76,0.22),rgba(200,130,106,0.28))] hover:ring-[#E5C980]/35",
                          plan.featured && "bg-[linear-gradient(135deg,#C9A84C,#C8826A)] text-black ring-0"
                        )}
                      >
                        Започни
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <Reveal className="mb-14">
            <p className="mb-4 text-xs uppercase tracking-[0.32em] text-[#E5C980]">Възражения</p>
            <h2 className={cn("max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl", titleClassName)}>
              Знаем какво те спира. Затова го казваме ясно.
            </h2>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-2">
            {faqs.map((item, index) => (
              <Reveal key={item.q} delay={index * 0.04}>
                <motion.div
                  layout
                  className={cn(
                    "rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl",
                    item.accent === "phone" && "ring-1 ring-[#C9A84C]/25 shadow-[0_0_60px_rgba(201,168,76,0.12)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <div className="flex items-start gap-4">
                      {item.accent === "phone" ? <PhoneAccentIcon /> : null}
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-white">{item.q}</h3>
                        {item.accent === "phone" ? (
                          <p className="mt-2 text-sm uppercase tracking-[0.24em] text-[#E5C980]">Най-честото възражение</p>
                        ) : null}
                      </div>
                    </div>

                    <motion.span
                      animate={{ rotate: openFaq === index ? 45 : 0 }}
                      className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xl text-white/70"
                    >
                      +
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openFaq === index ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="ml-0 mt-5 leading-8 text-white/70 lg:ml-13">{item.a}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-28 pt-8 lg:px-10 lg:pb-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 px-8 py-16 text-center backdrop-blur-xl sm:px-12 lg:px-20 lg:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_42%)]" />
              <div className="relative">
                <p className="mb-4 text-xs uppercase tracking-[0.32em] text-[#E5C980]">Финален ход</p>
                <h2 className={cn("text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl", titleClassName)}>
                  Остави хаоса. Вземи по-спокоен бизнес.
                </h2>
                <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/70">
                  Ако искаш сайт, който изглежда скъпо, записва клиенти сам и ти помага да мислиш по-ясно, SalonApp е за теб.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href={getStartedHref}
                    className="inline-flex min-w-[240px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-black shadow-[0_20px_80px_rgba(201,168,76,0.25)]"
                  >
                    Искам безплатен месец
                  </Link>
                  <Link
                    href={demoSalonHref}
                    className="inline-flex min-w-[240px] items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-8 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-white"
                  >
                    Виж демо салон
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
