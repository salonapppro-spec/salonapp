"use client";
/* eslint-disable @next/next/no-page-custom-font */

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { LandingTracker } from "@/components/marketing/LandingTracker";

const gold = "#C9A84C";
const roseGold = "#C8826A";
const demoSalonHref = "/lindy-design";

const faqs = [
  {
    q: "Клиентките ми предпочитат да звънят.",
    a: "Нека звънят. Направили сме функция „Бърз час“ специално за теб. Докато си говорите, просто въвеждаш телефона ѝ. Системата намира името и запазва часа с един клик. Онлайн сайтът хваща и тези, които се сещат късно вечер.",
  },
  {
    q: "Сложно е, не разбирам от компютри.",
    a: "Ако знаеш как да влезеш във Facebook, значи знаеш как да ползваш и това. Ние правим дизайна и настройваме всичко вместо теб.",
  },
  {
    q: "19 евро са много пари.",
    a: "Един пропуснат час често струва повече. Системата връща стойността си с по-малко пропуснати посещения и по-малко време в чатове и телефон.",
  },
  {
    q: "Ами ако реша да спра?",
    a: "Спираш когато поискаш. Няма дълги договори и клиентските данни си остават твои.",
  },
  {
    q: "Имам си тефтер, той ми е безплатен.",
    a: "Тефтерът не праща напомняния, не пази история на клиентите и не ти показва кога работиш на печалба и кога на загуба.",
  },
  {
    q: "Нямам време да го настройвам.",
    a: "Точно това е идеята. Ти пращаш ценоразписа и основните детайли, а ние качваме всичко вместо теб.",
  },
];

const plans = [
  {
    name: "СТАНДАРТ",
    price: "19",
    featured: false,
    features: ["1 Специалист", "Твой собствен сайт (субдомейн)", "Дигитален график", "Онлайн резервации 24/7", "Бизнес калкулатор и месечни отчети"],
  },
  {
    name: "ПРО",
    price: "29",
    featured: true,
    tag: "Най-избиран",
    features: ["1 Специалист", "Всичко от Стандарт", "Имейл след посещение за отзиви (Google/Facebook)", "Google Business настройка", "SEO и AI оптимизация"],
  },
  {
    name: "ПРЕМИУМ",
    price: "49",
    featured: false,
    features: ["До 3 специалиста — отделни админ панели и графици, общ сайт", "Всичко от Про", "SMS и Viber напомняния", "По-силен automation пакет"],
  },
  {
    name: "КОЛЕКТИВ",
    price: "49",
    featured: false,
    features: ["Неограничен брой специалисти", "Всеки вижда своя график", "Всичко от Про", "Опция SMS/Viber на човек", "Подходящо за екипи"],
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const staggerParent = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.12 } },
  viewport: { once: true, amount: 0.15 },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;700&display=swap');

  .salon-root {
    background: #09090b;
    color: #e4e4e7;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    line-height: 1.7;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .salon-root * { box-sizing: border-box; }

  .orb {
    position: absolute;
    border-radius: 9999px;
    filter: blur(90px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
  }

  .orb-gold { width: 600px; height: 600px; background: ${gold}; top: -200px; left: -200px; }
  .orb-rose { width: 500px; height: 500px; background: ${roseGold}; top: 100px; right: -150px; }
  .orb-mid { width: 400px; height: 400px; background: ${gold}; top: 800px; right: 20%; opacity: 0.10; }

  .glass-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(9,9,11,0.75);
    border-bottom: 0.5px solid rgba(201,168,76,0.2);
  }

  .nav-inner, .hero-shell, .section-shell, .footer-shell {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .nav-inner {
    min-height: 68px;
    padding: 0 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .brand {
    color: #fafafa;
    text-decoration: none;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.65rem;
    letter-spacing: 0.05em;
  }

  .brand span { color: ${gold}; }

  .nav-actions, .hero-actions, .footer-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.85rem;
    justify-content: center;
  }

  .nav-cta, .hero-btn, .hero-secondary, .price-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.25s;
  }

  .nav-cta {
    background: transparent;
    border: 1px solid ${gold};
    color: ${gold};
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 9px 20px;
    border-radius: 2px;
  }

  .nav-cta:hover { background: rgba(201,168,76,0.12); }

  .hero-section {
    position: relative;
    min-height: 92vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6rem 1.25rem 4rem;
    overflow: hidden;
  }

  .hero-shell, .section-shell, .footer-shell {
    position: relative;
    z-index: 1;
  }

  .hero-eyebrow, .section-label {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${gold};
    margin-bottom: 1rem;
    opacity: 0.9;
  }

  .hero-title, .section-title, .footer-title {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    color: #fafafa;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .hero-title { font-size: clamp(42px, 7vw, 82px); margin-bottom: 1.5rem; }
  .section-title { font-size: clamp(32px, 4vw, 52px); margin-bottom: 1rem; }
  .footer-title { font-size: clamp(36px, 5vw, 60px); margin-bottom: 1rem; }

  .hero-title em {
    font-style: italic;
    background: linear-gradient(135deg, ${gold}, ${roseGold});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-sub, .section-sub, .footer-text {
    font-size: 16px;
    color: #a1a1aa;
    max-width: 640px;
    margin: 0 auto 2.5rem;
    line-height: 1.8;
  }

  .hero-btn {
    background: linear-gradient(135deg, ${gold}, ${roseGold});
    color: #09090b;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 16px 36px;
    border-radius: 2px;
  }

  .hero-btn:hover { opacity: 0.88; transform: translateY(-1px); }

  .hero-secondary {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(201,168,76,0.45);
    color: #fafafa;
    padding: 15px 28px;
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 2px;
  }

  .hero-secondary:hover { border-color: rgba(201,168,76,0.9); background: rgba(201,168,76,0.08); }

  .hero-micro, .footer-micro {
    font-size: 13px;
    color: #71717a;
    margin-top: 1rem;
  }

  .trust-bar {
    position: relative;
    z-index: 1;
    border-top: 0.5px solid rgba(201,168,76,0.15);
    border-bottom: 0.5px solid rgba(201,168,76,0.15);
    padding: 1.8rem 1.25rem;
    display: flex;
    justify-content: center;
    gap: 4rem;
    flex-wrap: wrap;
    background: rgba(255,255,255,0.02);
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #a1a1aa;
  }

  .trust-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${gold};
    flex-shrink: 0;
  }

  .section {
    position: relative;
    z-index: 1;
    padding: 6rem 1.25rem;
  }

  .bento-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 16px;
  }

  .bento-card, .price-card {
    background: rgba(255,255,255,0.03);
    border: 0.5px solid rgba(201,168,76,0.2);
    border-radius: 4px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .bento-card {
    transition: border-color 0.3s, background 0.3s;
  }

  .bento-card:hover {
    border-color: rgba(201,168,76,0.5);
    background: rgba(201,168,76,0.04);
  }

  .bento-card:first-child { grid-column: 1 / 2; grid-row: 1; }
  .bento-card:nth-child(2) { grid-column: 2 / 3; grid-row: 1 / 3; display: flex; flex-direction: column; justify-content: space-between; }
  .bento-card:nth-child(3) { grid-column: 1 / 2; grid-row: 2; }
  .bento-card:nth-child(4) { grid-column: 1 / 3; grid-row: 3; }

  .bento-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px;
    font-weight: 300;
    color: rgba(201,168,76,0.2);
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .bento-title {
    font-size: 15px;
    font-weight: 500;
    color: #e4e4e7;
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }

  .bento-text {
    font-size: 14px;
    color: #71717a;
    line-height: 1.8;
  }

  .pricing-wrap {
    background: rgba(255,255,255,0.015);
    border-top: 0.5px solid rgba(201,168,76,0.1);
    border-bottom: 0.5px solid rgba(201,168,76,0.1);
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .price-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: border-color 0.3s;
  }

  .price-card:hover { border-color: rgba(201,168,76,0.3); }

  .price-card.featured {
    border: 1.5px solid ${gold};
    background: rgba(201,168,76,0.05);
    transform: scale(1.02);
  }

  .price-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, ${gold}, ${roseGold});
    color: #09090b;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 20px;
    white-space: nowrap;
  }

  .price-name {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${gold};
  }

  .price-amount {
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 300;
    color: #fafafa;
    line-height: 1;
  }

  .price-amount span {
    font-size: 18px;
    color: #71717a;
  }

  .price-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    margin: 0;
    padding: 0;
  }

  .price-features li {
    font-size: 13px;
    color: #a1a1aa;
    padding-left: 14px;
    position: relative;
    line-height: 1.5;
  }

  .price-features li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${gold};
    opacity: 0.6;
  }

  .price-btn {
    width: 100%;
    background: transparent;
    border: 0.5px solid rgba(201,168,76,0.4);
    color: ${gold};
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 12px;
    border-radius: 2px;
    margin-top: auto;
  }

  .price-btn:hover { background: rgba(201,168,76,0.1); }

  .price-card.featured .price-btn {
    background: linear-gradient(135deg, ${gold}, ${roseGold});
    border: none;
    color: #09090b;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    border: 0.5px solid rgba(201,168,76,0.15);
    border-radius: 4px;
    overflow: hidden;
  }

  .faq-item { border-bottom: 0.5px solid rgba(201,168,76,0.12); }
  .faq-item:last-child { border-bottom: none; }

  .faq-q {
    width: 100%;
    background: transparent;
    border: none;
    text-align: left;
    padding: 1.25rem 1.5rem;
    font-size: 15px;
    font-weight: 400;
    color: #e4e4e7;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .faq-q:hover { background: rgba(201,168,76,0.04); }

  .faq-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: ${gold};
    font-size: 18px;
    line-height: 1;
    transition: transform 0.25s;
  }

  .faq-icon.open { transform: rotate(45deg); }

  .faq-a {
    padding: 0 1.5rem 1.25rem;
    font-size: 14px;
    color: #71717a;
    line-height: 1.8;
    display: none;
  }

  .faq-a.open { display: block; }

  .footer-section {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 6rem 1.25rem 4rem;
    border-top: 0.5px solid rgba(201,168,76,0.15);
  }

  .footer-legal {
    margin-top: 5rem;
    padding-top: 2rem;
    border-top: 0.5px solid rgba(255,255,255,0.06);
    font-size: 12px;
    color: #3f3f46;
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .footer-legal a {
    color: #52525b;
    text-decoration: none;
  }

  .footer-legal a:hover { color: ${gold}; }

  @media (max-width: 900px) {
    .pricing-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 700px) {
    .bento-grid { grid-template-columns: 1fr; }
    .bento-card:first-child, .bento-card:nth-child(2), .bento-card:nth-child(3), .bento-card:nth-child(4) {
      grid-column: 1;
      grid-row: auto;
    }
    .trust-bar { gap: 2rem; }
    .nav-inner { flex-direction: column; justify-content: center; padding: 0.85rem 1rem; }
  }

  @media (max-width: 500px) {
    .pricing-grid { grid-template-columns: 1fr; }
  }
`;

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <LandingTracker />
      <style>{styles}</style>

      <div className="salon-root">
        <nav className="glass-nav">
          <div className="nav-inner">
            <Link href="/" className="brand">
              SalonApp<span>.pro</span>
            </Link>

            <div className="nav-actions">
              <Link href={demoSalonHref} className="nav-cta">
                Виж демо салон
              </Link>
              <Link href="/get-started" className="nav-cta">
                Безплатен месец
              </Link>
            </div>
          </div>
        </nav>

        <section className="hero-section">
          <div className="orb orb-gold" />
          <div className="orb orb-rose" />
          <div className="orb orb-mid" />

          <motion.div className="hero-shell" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.p className="hero-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: 0.15, duration: 0.5 }}>
              salonapp.pro — за красота и успех
            </motion.p>
            <motion.h1 className="hero-title" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}>
              Твоят бизнес заслужава
              <br />
              повече от <em>тефтер.</em>
            </motion.h1>
            <motion.p className="hero-sub" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}>
              Пълно е с работа, но накрая на месеца не знаеш къде са парите? Спри да губиш време в писане на съобщения.
              Вземи сайт, който записва клиенти сам и ти казва колко точно печелиш. Уеб дизайнът и пълната настройка са
              безплатни от нас.
            </motion.p>

            <motion.div className="hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}>
              <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link href="/get-started" className="hero-btn">
                  Искам безплатен месец
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link href={demoSalonHref} className="hero-secondary">
                  Виж демо салон
                </Link>
              </motion.div>
            </motion.div>

            <motion.p className="hero-micro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}>
              Без банкова карта при регистрация. Без договори. Спираш, когато поискаш.
            </motion.p>
          </motion.div>
        </section>

        <motion.div className="trust-bar" {...fadeInUp}>
          <motion.div className="trust-item" whileHover={{ y: -2 }}>
            <span className="trust-dot" />
            <span>Готов сайт за 24 часа — ти не пипаш нищо</span>
          </motion.div>
          <motion.div className="trust-item" whileHover={{ y: -2 }}>
            <span className="trust-dot" />
            <span>Работи перфектно на твоя телефон</span>
          </motion.div>
          <motion.div className="trust-item" whileHover={{ y: -2 }}>
            <span className="trust-dot" />
            <span>Данните и клиентите са 100% твоя собственост</span>
          </motion.div>
        </motion.div>

        <section className="section">
          <motion.div className="section-shell" {...fadeInUp}>
            <p className="section-label">Решения</p>
            <h2 className="section-title">Проблемите, които решаваме.</h2>
            <motion.div className="bento-grid" {...staggerParent}>
              <motion.div className="bento-card" variants={fadeInUp} whileHover={{ y: -6 }}>
                <div className="bento-num">01</div>
                <div className="bento-title">
                  Твоята лична витрина
                  <br />
                  <span style={{ color: gold, fontWeight: 300, fontSize: 13 }}>Ние ти правим дизайна безплатно</span>
                </div>
                <p className="bento-text">
                  Вместо да си просто един профил сред много други, получаваш собствен красив сайт. Клиентката влиза и
                  вижда само теб, твоите услуги и твоя стил.
                </p>
              </motion.div>

              <motion.div className="bento-card" variants={fadeInUp} whileHover={{ y: -6 }}>
                <div className="bento-num">02</div>
                <div className="bento-title">
                  Дигитален график
                  <br />
                  <span style={{ color: gold, fontWeight: 300, fontSize: 13 }}>Твоят секретар 24/7</span>
                </div>
                <p className="bento-text">
                  Клиентите вече се записват сами от телефона си. А ако някоя клиентка ти звънне, имаш функция „Бърз
                  час“. Пишеш само номера ѝ и системата сама попълва името.
                </p>
                <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
                  <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, ${gold}40, transparent)` }} />
                  <p style={{ fontSize: 12, color: "#52525b", marginTop: "0.75rem" }}>Синхронизация в реално време</p>
                </div>
              </motion.div>

              <motion.div className="bento-card" variants={fadeInUp} whileHover={{ y: -6 }}>
                <div className="bento-num">03</div>
                <div className="bento-title">
                  Край на забравените часове
                  <br />
                  <span style={{ color: gold, fontWeight: 300, fontSize: 13 }}>Автоматични напомняния</span>
                </div>
                <p className="bento-text">
                  Когато клиентката забрави за часа си, ти губиш пари. Сайтът праща автоматично съобщение преди
                  посещението и намалява пропуснатите резервации.
                </p>
              </motion.div>

              <motion.div className="bento-card" variants={fadeInUp} whileHover={{ y: -6 }}>
                <div className="bento-num">04</div>
                <div className="bento-title">
                  Бизнес калкулатор
                  <br />
                  <span style={{ color: gold, fontWeight: 300, fontSize: 13 }}>Знаеш колко пари ти остават</span>
                </div>
                <p className="bento-text">
                  Работиш много, но накрая не знаеш колко е чистата печалба? Системата ти показва приходите, разходите и
                  реалната картина на бизнеса.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        <div className="pricing-wrap">
          <section className="section" id="pricing">
            <motion.div className="section-shell" {...fadeInUp}>
              <p className="section-label">Планове и цени</p>
              <h2 className="section-title">Избери план. Смени го или го спри, когато поискаш.</h2>
              <p className="section-sub">Всички планове включват безплатен уеб дизайн от нас и 1 месец напълно безплатно.</p>

              <motion.div className="pricing-grid" {...staggerParent}>
                {plans.map((plan) => (
                  <motion.div key={plan.name} className={`price-card ${plan.featured ? "featured" : ""}`} variants={fadeInUp} whileHover={{ y: -8 }}>
                    {plan.tag ? <span className="price-badge">{plan.tag}</span> : null}
                    <div className="price-name">{plan.name}</div>
                    <div className="price-amount">
                      {plan.price}
                      <span>€ / месец</span>
                    </div>
                    <ul className="price-features">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <Link href="/get-started" className="price-btn">
                      Започни безплатно
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </section>
        </div>

        <section className="section">
          <motion.div className="section-shell" {...fadeInUp}>
            <p className="section-label">Въпроси</p>
            <h2 className="section-title">Знаем какво си помисли вече.</h2>

            <motion.div className="faq-list" {...staggerParent}>
              {faqs.map((item, index) => (
                <motion.div key={item.q} className="faq-item" variants={fadeInUp}>
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    <span>{item.q}</span>
                    <motion.span className={`faq-icon ${openFaq === index ? "open" : ""}`} animate={{ rotate: openFaq === index ? 45 : 0 }}>
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index ? (
                      <motion.div
                        className="faq-a open"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div>{item.a}</div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <footer className="footer-section">
          <motion.div
            className="orb"
            animate={{ y: [0, -14, 0], opacity: [0.08, 0.14, 0.08] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 500, height: 500, background: roseGold, bottom: -200, left: "30%", opacity: 0.12, position: "absolute" }}
          />

          <motion.div className="footer-shell" {...fadeInUp}>
            <h2 className="footer-title">Остави тефтера в миналото.</h2>
            <p className="footer-text">Попълни формата сега. Ние ще ти се обадим и до 24 часа ще имаш готов, работещ сайт.</p>

            <div className="footer-actions">
              <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link href="/get-started" className="hero-btn">
                  Искам безплатен месец
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Link href={demoSalonHref} className="hero-secondary">
                  Виж демо салон
                </Link>
              </motion.div>
            </div>

            <p className="footer-micro">Без карта при регистрация. Без обвързване. Данните ти остават при теб.</p>

            <div className="footer-legal">
              <span>© 2026 SA | SalonApp. Всички права запазени.</span>
              <Link href="/admin/login">Админ вход</Link>
              <Link href="/super-admin">Супер админ</Link>
            </div>
          </motion.div>
        </footer>
      </div>
    </>
  );
}
