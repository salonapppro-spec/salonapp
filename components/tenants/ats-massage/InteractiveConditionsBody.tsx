"use client";

import { useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────────
   ATS Studio — Интерактивна секция „Състояния".
   Реално анатомично тяло (заден изглед) с левитиращи chip-ове —
   всеки „плава" близо до точката на болката (анатомичен callout):
   маркер върху тялото + тънка линия към chip в страничното поле.
   Клик/tap:
     · desktop → инфо картата „пада" точно до chip-а (popover),
       а НЕ като отделен прозорец под тялото.
     · mobile  → bottom sheet (chip-овете се свиват до точки).
   Chip-овете са <button> с aria-label, работят с клавиатура и Escape.
   SEO текстовете остават в DOM. Позициите са в проценти → responsive.
   ──────────────────────────────────────────────────────────────── */

const BODY_IMG = "/tenants/ats-massage/body.png";

type Side = "left" | "right";

export type BodyCondition = {
  id: string;
  title: string;
  description: string;
  positionPercentX: number;
  positionPercentY: number;
  /** На кой борд (desktop) да левитира chip-ът спрямо тялото. */
  side: Side;
};

const CONDITIONS: BodyCondition[] = [
  {
    id: "glavobolie",
    title: "Главоболие от напрежение",
    description:
      "Голяма част от главоболията тръгват от напрегнати мускули във врата и раменете. Работата върху тях често носи трайно облекчение.",
    positionPercentX: 50,
    positionPercentY: 7,
    side: "right",
  },
  {
    id: "vrat",
    title: "Болки във врата и схванат врат",
    description:
      "Заседналата работа и стресът водят до скованост във врата. Освобождавам напрегнатата мускулатура и връщам свободата на движението.",
    positionPercentX: 50,
    positionPercentY: 14,
    side: "left",
  },
  {
    id: "pleksit",
    title: "Плексит",
    description:
      "Възпаление на нервния сплит в рамото с болка и изтръпване. Прилагам щадящи техники за облекчаване на напрежението около раменния пояс и възстановяване на подвижността.",
    positionPercentX: 60,
    positionPercentY: 22,
    side: "right",
  },
  {
    id: "spazmi",
    title: "Мускулни спазми и скованост",
    description:
      "Локалните спазми и сковаността в раменете ограничават ежедневието. Целенасочените техники ги разпускат и връщат подвижността.",
    positionPercentX: 40,
    positionPercentY: 22,
    side: "left",
  },
  {
    id: "grab",
    title: "Болки в гърба",
    description:
      "Комбинирам класически и дълбокотъканен масаж, за да облекча болката, да отпусна мускулните вериги и да подобря стойката.",
    positionPercentX: 50,
    positionPercentY: 31,
    side: "right",
  },
  {
    id: "hernia",
    title: "Дискова херния",
    description:
      "При дискова херния масажът отпуска околната мускулатура, подобрява кръвообращението и намалява защитния мускулен спазъм около засегнатия сегмент.",
    positionPercentX: 50,
    positionPercentY: 38,
    side: "left",
  },
  {
    id: "krast",
    title: "Болки в кръста",
    description:
      "Хроничното напрежение и претоварване в кръста реагира добре на дълбокотъканни и лечебни техники, които възстановяват мекотата на мускулите.",
    positionPercentX: 50,
    positionPercentY: 44,
    side: "right",
  },
  {
    id: "ishias",
    title: "Ишиас",
    description:
      "Болка по хода на седалищния нерв, която слиза към крака. Работя върху мускулатурата на кръста и таза, за да намаля притискането и да облекча острата симптоматика.",
    positionPercentX: 44,
    positionPercentY: 50,
    side: "left",
  },
  {
    id: "celulit",
    title: "Целулит",
    description:
      "Антицелулитният масаж подобрява микроциркулацията и тонуса на тъканите като част от последователна терапия.",
    positionPercentX: 57,
    positionPercentY: 61,
    side: "right",
  },
  {
    id: "sport",
    title: "Възстановяване след спорт",
    description:
      "След натоварване или травма помагам на мускулите да се възстановят по-бързо, да намаля болезнеността и да върна тонуса.",
    positionPercentX: 43,
    positionPercentY: 64,
    side: "left",
  },
  {
    id: "kravoobrashtenie",
    title: "Лошо кръвообращение",
    description:
      "Масажът активира кръвотока, подхранва тъканите и подпомага естественото възстановяване на тялото.",
    positionPercentX: 56,
    positionPercentY: 79,
    side: "right",
  },
  {
    id: "limfen-zastoi",
    title: "Лимфен застой и отоци",
    description:
      "Ръчният лимфен дренаж стимулира оттичането на лимфата, намалява отоците и усещането за тежест в крайниците.",
    positionPercentX: 45,
    positionPercentY: 90,
    side: "left",
  },
];

/** Ниските chip-ове отварят инфото нагоре, за да не излиза извън секцията. */
const popDir = (y: number): "up" | "down" => (y > 72 ? "up" : "down");

export function InteractiveConditionsBody() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const active = CONDITIONS.find((c) => c.id === activeId) ?? null;

  const rootRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLButtonElement | null>(null);
  const sheetCloseRef = useRef<HTMLButtonElement | null>(null);

  const openDot = (id: string, el: HTMLButtonElement) => {
    lastFocused.current = el;
    setActiveId((cur) => (cur === id ? null : id));
  };

  const close = () => {
    setActiveId(null);
    lastFocused.current?.focus();
  };

  // Reveal + staggered влизане на chip-овете, когато секцията се появи.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escape затваря активното състояние.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Фокусирай бутона за затваряне на bottom sheet при отваряне (mobile).
  useEffect(() => {
    if (active && sheetCloseRef.current) {
      sheetCloseRef.current.focus({ preventScroll: true });
    }
  }, [active]);

  return (
    <div ref={rootRef} className={`icb${inView ? " in" : ""}`}>
      <p className="icb-helper">
        Докоснете точките по тялото, за да видите как масажът може да помогне.
      </p>

      {/* ── Арена: тяло в центъра, chip-ове около него ── */}
      <div className="icb-arena">
        {/* Линии-водачи (desktop) — от chip към тялото */}
        <div className="icb-leads" aria-hidden="true">
          {CONDITIONS.map((c, i) => (
            <span
              key={c.id}
              className="icb-lead"
              data-side={c.side}
              style={
                {
                  "--y": `${c.positionPercentY}%`,
                  "--i": i,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Тяло + точкови маркери върху него (desktop) */}
        <div className="icb-body">
          <span className="icb-glow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="icb-figure"
            src={BODY_IMG}
            alt="Схематично човешко тяло (заден изглед) с обозначени зони на болка"
            loading="lazy"
            draggable={false}
          />
          <div className="icb-marks" aria-hidden="true">
            {CONDITIONS.map((c, i) => (
              <span
                key={c.id}
                className={`icb-mark${c.id === activeId ? " is-active" : ""}`}
                style={
                  {
                    "--x": `${c.positionPercentX}%`,
                    "--y": `${c.positionPercentY}%`,
                    "--i": i,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>

        {/* Левитиращи chip-ове (desktop: в полето; mobile: точки върху тялото) */}
        <div className="icb-nodes">
          {CONDITIONS.map((c, i) => {
            const isActive = c.id === activeId;
            const dir = popDir(c.positionPercentY);
            return (
              <div
                key={c.id}
                className={`icb-node${isActive ? " is-active" : ""}`}
                data-side={c.side}
                data-pop={dir}
                style={
                  {
                    "--x": `${c.positionPercentX}%`,
                    "--y": `${c.positionPercentY}%`,
                    "--i": i,
                  } as React.CSSProperties
                }
              >
                <button
                  type="button"
                  className="icb-chip"
                  aria-label={c.title}
                  aria-pressed={isActive}
                  aria-expanded={isActive}
                  onClick={(e) => openDot(c.id, e.currentTarget)}
                >
                  <span className="icb-chip-dot" aria-hidden="true" />
                  <span className="icb-chip-text">{c.title}</span>
                </button>

                {/* Инфо popover „пада" до chip-а (desktop) */}
                {isActive && (
                  <div className="icb-pop" role="dialog" aria-label={c.title}>
                    <button
                      type="button"
                      className="icb-card-close"
                      aria-label="Затвори"
                      onClick={close}
                    >
                      ×
                    </button>
                    <p className="icb-card-eyebrow">Състояние</p>
                    <h3 className="icb-card-title">{c.title}</h3>
                    <p className="icb-card-text">{c.description}</p>
                    <a href="#booking" className="icb-cta">
                      Запази час
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: bottom sheet ── */}
      {active && (
        <div className="icb-sheet-wrap" onClick={close} role="presentation">
          <div
            className="icb-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="icb-sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="icb-sheet-grip" aria-hidden="true" />
            <button
              ref={sheetCloseRef}
              type="button"
              className="icb-card-close"
              aria-label="Затвори"
              onClick={close}
            >
              ×
            </button>
            <p className="icb-card-eyebrow">Състояние</p>
            <h3 id="icb-sheet-title" className="icb-card-title">
              {active.title}
            </h3>
            <p className="icb-card-text">{active.description}</p>
            <a href="#booking" className="icb-cta" onClick={close}>
              Запазете час за това състояние
            </a>
          </div>
        </div>
      )}

      {/* ── Скрит SEO-списък (всички текстове остават в DOM) ── */}
      <ul className="icb-seo">
        {CONDITIONS.map((c) => (
          <li key={c.id}>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
          </li>
        ))}
      </ul>

      <style>{css}</style>
    </div>
  );
}

const css = `
.icb { width: 100%; }
.icb-helper {
  text-align: center;
  font-size: .95rem;
  line-height: 1.6;
  color: rgba(248,245,239,.7);
  margin: 0 auto 2.4rem;
  max-width: 48ch;
}

/* ── Арена (mobile-first: тялото заема цялата ширина) ── */
.icb-arena {
  position: relative;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}
.icb-body { position: relative; width: 100%; aspect-ratio: 1122 / 1402; }
.icb-glow {
  position: absolute;
  inset: -12% -18%;
  background: radial-gradient(closest-side, rgba(200,164,90,.16), rgba(200,164,90,0) 72%);
  pointer-events: none;
  z-index: 0;
}
.icb-figure {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 12px 40px rgba(0,0,0,.45));
}

/* ── Линии-водачи и маркери: само desktop ── */
.icb-leads { display: none; }
.icb-marks { display: none; }

/* ── Node (mobile: точка върху тялото) ── */
.icb-nodes { position: absolute; inset: 0; z-index: 3; }
.icb-node {
  position: absolute;
  left: var(--x);
  top: var(--y);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity .5s ease;
  transition-delay: calc(var(--i, 0) * 55ms);
}
.icb.in .icb-node { opacity: 1; }
.icb-node.is-active { z-index: 6; }

/* chip бутон — mobile: показва само точката (44px tap-зона) */
.icb-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ats-ivory, #F8F5EF);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  animation: icbFloat 6s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * .5s);
}
.icb-chip-dot {
  position: relative;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  flex: none;
  background: radial-gradient(circle at 35% 30%, #f6e6bd 0%, var(--ats-gold, #C8A45A) 58%, #a9863f 100%);
  box-shadow: 0 0 0 5px rgba(200,164,90,.15), 0 0 12px 2px rgba(200,164,90,.6);
  transition: transform .22s ease, box-shadow .22s ease;
  animation: icbPulse 2.4s ease-out infinite;
  animation-delay: calc(var(--i, 0) * 140ms);
}
.icb-chip-text {
  display: none;
  white-space: nowrap;
  font-size: .9rem;
  font-weight: 500;
  letter-spacing: .01em;
}
.icb-chip:hover .icb-chip-dot,
.icb-chip:focus-visible .icb-chip-dot,
.icb-node.is-active .icb-chip-dot {
  transform: scale(1.28);
  box-shadow: 0 0 0 6px rgba(200,164,90,.22), 0 0 18px 4px rgba(200,164,90,.8);
}
.icb-chip:focus-visible { outline: none; }

/* ── Инфо popover (desktop): скрит на mobile ── */
.icb-pop { display: none; }

/* ── Обща типография за картата (popover + sheet) ── */
.icb-card-eyebrow {
  font-size: .68rem;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: var(--ats-gold-soft, #D8BC85);
  font-weight: 600;
  margin: 0 0 .55rem;
}
.icb-card-title {
  font-family: var(--f-serif, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.45rem, 3.4vw, 1.9rem);
  font-weight: 600;
  line-height: 1.14;
  color: var(--ats-gold-soft, #D8BC85);
  margin: 0 0 .7rem;
}
.icb-card-text {
  font-size: .95rem;
  line-height: 1.7;
  color: rgba(248,245,239,.86);
  margin: 0;
}
.icb-card-close {
  position: absolute;
  top: .55rem;
  right: .6rem;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: rgba(248,245,239,.06);
  color: rgba(248,245,239,.8);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.icb-card-close:hover { background: rgba(200,164,90,.24); color: #fff; }
.icb-card-close:focus-visible {
  outline: 2px solid var(--ats-gold-soft, #D8BC85);
  outline-offset: 2px;
}

/* ── CTA ── */
.icb-cta {
  display: inline-block;
  margin-top: 1.2rem;
  padding: .72rem 1.7rem;
  border-radius: 999px;
  font-size: .76rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #0A192F;
  background: linear-gradient(135deg, var(--ats-gold-soft, #D8BC85), var(--ats-gold, #C8A45A));
  box-shadow: 0 10px 26px rgba(200,164,90,.28);
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
}
.icb-cta:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: 0 14px 32px rgba(200,164,90,.4);
}
.icb-cta:focus-visible {
  outline: 2px solid var(--ats-ivory, #F8F5EF);
  outline-offset: 3px;
}

@keyframes icbPulse {
  0%   { box-shadow: 0 0 0 5px rgba(200,164,90,.15), 0 0 12px 2px rgba(200,164,90,.55), 0 0 0 0 rgba(200,164,90,.5); }
  70%  { box-shadow: 0 0 0 5px rgba(200,164,90,.15), 0 0 12px 2px rgba(200,164,90,.55), 0 0 0 15px rgba(200,164,90,0); }
  100% { box-shadow: 0 0 0 5px rgba(200,164,90,.15), 0 0 12px 2px rgba(200,164,90,.55), 0 0 0 0 rgba(200,164,90,0); }
}
@keyframes icbFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
@keyframes icbFade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Bottom sheet (mobile) ── */
.icb-sheet-wrap {
  display: flex;
  align-items: flex-end;
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(10,25,47,.6);
  backdrop-filter: blur(3px);
  animation: icbFade .2s ease;
}
.icb-sheet {
  position: relative;
  width: 100%;
  background: var(--ats-midnight-deep, #0A192F);
  border-top: 2px solid var(--ats-gold, #C8A45A);
  border-radius: 22px 22px 0 0;
  padding: 1.6rem 1.4rem calc(1.9rem + env(safe-area-inset-bottom, 0px));
  max-height: 80vh;
  overflow-y: auto;
  text-align: center;
  box-shadow: 0 -16px 44px rgba(0,0,0,.45);
  animation: icbSlideUp .32s cubic-bezier(.22,.61,.36,1);
}
.icb-sheet-grip {
  display: block;
  width: 44px; height: 4px;
  border-radius: 4px;
  background: rgba(248,245,239,.28);
  margin: 0 auto 1.2rem;
}
.icb-sheet .icb-card-close { top: 1rem; right: 1rem; }
.icb-sheet .icb-card-text { margin: 0 auto; max-width: 46ch; }
.icb-sheet .icb-cta { width: 100%; }
@keyframes icbSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* ── Скрит SEO списък ── */
.icb-seo {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ════════════════════════════════════════════════════════════
   DESKTOP (≥ 901px): анатомичен callout —
   тяло в центъра (360px), chip-ове левитират в страничните полета,
   линии-водачи ги свързват с маркерите върху тялото.
   Половината тяло = 180px → водачите стигат до 50% ± 190px.
   ════════════════════════════════════════════════════════════ */
@media (min-width: 901px) {
  .icb-arena { max-width: 900px; }
  .icb-body { width: 360px; margin: 0 auto; }

  /* маркери върху тялото */
  .icb-marks { display: block; position: absolute; inset: 0; z-index: 4; pointer-events: none; }
  .icb-mark {
    position: absolute;
    left: var(--x); top: var(--y);
    width: 13px; height: 13px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle at 35% 30%, #f6e6bd 0%, var(--ats-gold, #C8A45A) 58%, #a9863f 100%);
    box-shadow: 0 0 0 5px rgba(200,164,90,.14), 0 0 10px 2px rgba(200,164,90,.55);
    opacity: 0;
    transition: opacity .6s ease, transform .22s ease, box-shadow .22s ease;
    transition-delay: calc(var(--i, 0) * 55ms), 0s, 0s;
    animation: icbPulse 2.4s ease-out infinite;
    animation-delay: calc(var(--i, 0) * 140ms);
  }
  .icb.in .icb-mark { opacity: 1; }
  .icb-mark.is-active {
    transform: translate(-50%, -50%) scale(1.4);
    box-shadow: 0 0 0 6px rgba(200,164,90,.24), 0 0 20px 5px rgba(200,164,90,.85);
  }

  /* линии-водачи */
  .icb-leads { display: block; position: absolute; inset: 0; z-index: 2; pointer-events: none; }
  .icb-lead {
    position: absolute;
    top: var(--y);
    height: 1px;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity .6s ease;
    transition-delay: calc(var(--i, 0) * 55ms);
  }
  .icb.in .icb-lead { opacity: 1; }
  .icb-lead[data-side="left"]  { left: 0; right: calc(50% + 190px); background: linear-gradient(90deg, rgba(200,164,90,.55), rgba(200,164,90,.12)); }
  .icb-lead[data-side="right"] { left: calc(50% + 190px); right: 0; background: linear-gradient(90deg, rgba(200,164,90,.12), rgba(200,164,90,.55)); }

  /* node → изнесен в страничното поле, вертикално центриран на точката */
  .icb-node {
    left: auto; right: auto; top: var(--y);
    transform: translateY(-50%);
  }
  .icb-node[data-side="left"]  { left: 0; }
  .icb-node[data-side="right"] { right: 0; }

  /* пълен pill */
  .icb-chip {
    min-width: 0; min-height: 0;
    padding: .6rem 1.15rem;
    border-radius: 999px;
    background: rgba(15,35,67,.55);
    border: 1px solid rgba(200,164,90,.5);
    backdrop-filter: blur(7px);
    box-shadow: 0 18px 44px -24px rgba(0,0,0,.75);
    transition: transform .2s ease, border-color .2s ease, background .2s ease;
  }
  .icb-node[data-side="left"] .icb-chip { flex-direction: row-reverse; }
  .icb-chip-text { display: inline; }
  .icb-chip:hover,
  .icb-chip:focus-visible {
    border-color: rgba(216,188,133,.9);
    background: rgba(15,35,67,.72);
  }
  .icb-chip:focus-visible {
    outline: 2px solid var(--ats-gold-soft, #D8BC85);
    outline-offset: 3px;
  }
  .icb-node.is-active .icb-chip {
    border-color: var(--ats-gold, #C8A45A);
    background: rgba(15,35,67,.85);
  }

  /* popover „пада" до chip-а */
  .icb-pop {
    display: block;
    position: absolute;
    width: 258px;
    padding: 1.05rem 1.2rem 1.15rem;
    border-radius: 16px;
    background: var(--ats-midnight-deep, #0A192F);
    border: 1px solid rgba(200,164,90,.5);
    box-shadow: 0 26px 60px -22px rgba(0,0,0,.85);
    text-align: left;
    z-index: 7;
    animation: icbFade .25s ease;
  }
  .icb-node[data-side="left"]  .icb-pop { left: 0; }
  .icb-node[data-side="right"] .icb-pop { right: 0; }
  .icb-node[data-pop="down"] .icb-pop { top: calc(100% + 14px); }
  .icb-node[data-pop="up"]   .icb-pop { bottom: calc(100% + 14px); }
  /* по-компактна типография в тесния popover */
  .icb-pop .icb-card-eyebrow { font-size: .58rem; letter-spacing: .22em; margin-bottom: .45rem; }
  .icb-pop .icb-card-title { font-size: 1.16rem; line-height: 1.2; margin-bottom: .5rem; }
  .icb-pop .icb-card-text { font-size: .84rem; line-height: 1.6; max-width: none; }
  .icb-pop .icb-cta { margin-top: 1rem; padding: .6rem 1.4rem; font-size: .68rem; }
  .icb-pop .icb-card-close { top: .4rem; right: .45rem; width: 28px; height: 28px; font-size: 1.3rem; }

  /* на desktop bottom sheet не се ползва */
  .icb-sheet-wrap { display: none; }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .icb-chip, .icb-chip-dot, .icb-mark { animation: none; }
  .icb-node, .icb-lead, .icb-mark { transition: none; opacity: 1; }
  .icb-chip, .icb-chip-dot, .icb-cta, .icb-pop, .icb-sheet { transition: none; }
}
`;
