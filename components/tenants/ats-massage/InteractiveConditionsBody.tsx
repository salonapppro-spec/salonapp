"use client";

import { useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────────
   ATS Studio — Интерактивна секция „Състояния".
   Реално анатомично тяло (заден изглед) с пулсиращи точки за болка.
   Клик/tap отваря карта (desktop, под тялото) или bottom sheet (mobile)
   с описание + CTA „Запази час". Точките са <button> с aria-label,
   работят с клавиатура и Escape. SEO текстовете остават в DOM.
   Позициите са в проценти → responsive спрямо контейнера на тялото.
   ──────────────────────────────────────────────────────────────── */

const BODY_IMG = "/tenants/ats-massage/body.png";

export type BodyCondition = {
  id: string;
  title: string;
  description: string;
  positionPercentX: number;
  positionPercentY: number;
};

const CONDITIONS: BodyCondition[] = [
  {
    id: "glavobolie",
    title: "Главоболие от напрежение",
    description:
      "Голяма част от главоболията тръгват от напрегнати мускули във врата и раменете. Работата върху тях често носи трайно облекчение.",
    positionPercentX: 50,
    positionPercentY: 7,
  },
  {
    id: "vrat",
    title: "Болки във врата и схванат врат",
    description:
      "Заседналата работа и стресът водят до скованост във врата. Освобождавам напрегнатата мускулатура и връщам свободата на движението.",
    positionPercentX: 50,
    positionPercentY: 14,
  },
  {
    id: "pleksit",
    title: "Плексит",
    description:
      "Възпаление на нервния сплит в рамото с болка и изтръпване. Прилагам щадящи техники за облекчаване на напрежението около раменния пояс и възстановяване на подвижността.",
    positionPercentX: 60,
    positionPercentY: 22,
  },
  {
    id: "spazmi",
    title: "Мускулни спазми и скованост",
    description:
      "Локалните спазми и сковаността в раменете ограничават ежедневието. Целенасочените техники ги разпускат и връщат подвижността.",
    positionPercentX: 40,
    positionPercentY: 22,
  },
  {
    id: "grab",
    title: "Болки в гърба",
    description:
      "Комбинирам класически и дълбокотъканен масаж, за да облекча болката, да отпусна мускулните вериги и да подобря стойката.",
    positionPercentX: 50,
    positionPercentY: 31,
  },
  {
    id: "hernia",
    title: "Дискова херния",
    description:
      "При дискова херния масажът отпуска околната мускулатура, подобрява кръвообращението и намалява защитния мускулен спазъм около засегнатия сегмент.",
    positionPercentX: 50,
    positionPercentY: 38,
  },
  {
    id: "krast",
    title: "Болки в кръста",
    description:
      "Хроничното напрежение и претоварване в кръста реагира добре на дълбокотъканни и лечебни техники, които възстановяват мекотата на мускулите.",
    positionPercentX: 50,
    positionPercentY: 44,
  },
  {
    id: "ishias",
    title: "Ишиас",
    description:
      "Болка по хода на седалищния нерв, която слиза към крака. Работя върху мускулатурата на кръста и таза, за да намаля притискането и да облекча острата симптоматика.",
    positionPercentX: 44,
    positionPercentY: 50,
  },
  {
    id: "celulit",
    title: "Целулит",
    description:
      "Антицелулитният масаж подобрява микроциркулацията и тонуса на тъканите като част от последователна терапия.",
    positionPercentX: 57,
    positionPercentY: 61,
  },
  {
    id: "sport",
    title: "Възстановяване след спорт",
    description:
      "След натоварване или травма помагам на мускулите да се възстановят по-бързо, да намаля болезнеността и да върна тонуса.",
    positionPercentX: 43,
    positionPercentY: 64,
  },
  {
    id: "kravoobrashtenie",
    title: "Лошо кръвообращение",
    description:
      "Масажът активира кръвотока, подхранва тъканите и подпомага естественото възстановяване на тялото.",
    positionPercentX: 56,
    positionPercentY: 79,
  },
  {
    id: "limfen-zastoi",
    title: "Лимфен застой и отоци",
    description:
      "Ръчният лимфен дренаж стимулира оттичането на лимфата, намалява отоците и усещането за тежест в крайниците.",
    positionPercentX: 45,
    positionPercentY: 90,
  },
];

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

  // Reveal + staggered влизане на точките, когато секцията се появи.
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

      {/* ── Центрирано тяло с точки ── */}
      <div className="icb-stage-wrap">
        <div className="icb-stage">
          <span className="icb-glow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="icb-figure"
            src={BODY_IMG}
            alt="Схематично човешко тяло (заден изглед) с обозначени зони на болка"
            loading="lazy"
            draggable={false}
          />
          <div className="icb-dots">
            {CONDITIONS.map((c, i) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`icb-dot${isActive ? " is-active" : ""}`}
                  style={
                    {
                      left: `${c.positionPercentX}%`,
                      top: `${c.positionPercentY}%`,
                      "--i": i,
                    } as React.CSSProperties
                  }
                  aria-label={c.title}
                  aria-pressed={isActive}
                  onClick={(e) => openDot(c.id, e.currentTarget)}
                >
                  <span className="icb-dot-core" aria-hidden="true" />
                  <span className="icb-dot-label" aria-hidden="true">
                    {c.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Информационна карта (desktop: под тялото, центрирана) ── */}
      <div className="icb-panel" aria-live="polite">
        {active ? (
          <div className="icb-card" key={active.id}>
            <button
              type="button"
              className="icb-card-close"
              aria-label="Затвори"
              onClick={close}
            >
              ×
            </button>
            <p className="icb-card-eyebrow">Състояние</p>
            <h3 className="icb-card-title">{active.title}</h3>
            <p className="icb-card-text">{active.description}</p>
            <a href="#booking" className="icb-cta">
              Запазете час за това състояние
            </a>
          </div>
        ) : (
          <div className="icb-card icb-card-empty">
            <p className="icb-card-eyebrow">Как работи</p>
            <p className="icb-card-text">
              Изберете точка по тялото, за да видите с кое състояние работя и как
              терапевтичният масаж може да помогне точно на вас.
            </p>
            <a href="#booking" className="icb-cta">
              Запазете своя час
            </a>
          </div>
        )}
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

/* ── Тяло ── */
.icb-stage-wrap { display: flex; justify-content: center; }
.icb-stage {
  position: relative;
  width: min(88vw, 400px);
  aspect-ratio: 1122 / 1402;
  animation: icbFloat 7s ease-in-out infinite;
}
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

/* ── Точки ── */
.icb-dots { position: absolute; inset: 0; z-index: 2; }
.icb-dot {
  position: absolute;
  width: 48px;
  height: 48px;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  padding: 0;
  margin: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.icb-dot-core {
  position: relative;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #ffd1d1 0%, #ff6b6f 34%, #e5373d 66%, #b81f26 100%);
  box-shadow: 0 0 0 5px rgba(229,55,61,.16), 0 0 14px 3px rgba(229,55,61,.55);
  transition: transform .22s ease, box-shadow .22s ease;
  animation: icbPulse 2.3s ease-out infinite;
  animation-delay: calc(var(--i, 0) * 140ms);
}
/* влизане със стъпаловидно закъснение при scroll reveal */
.icb-dot { opacity: 0; transform: translate(-50%, -50%) scale(.4); }
.icb.in .icb-dot {
  animation: icbPop .5s cubic-bezier(.34,1.56,.64,1) forwards;
  animation-delay: calc(var(--i, 0) * 65ms);
}
.icb-dot:hover .icb-dot-core,
.icb-dot:focus-visible .icb-dot-core {
  transform: scale(1.32);
  box-shadow: 0 0 0 6px rgba(229,55,61,.2), 0 0 18px 5px rgba(229,55,61,.7);
}
.icb-dot:focus-visible {
  outline: 2px solid var(--ats-gold-soft, #D8BC85);
  outline-offset: 3px;
  border-radius: 50%;
}
.icb-dot.is-active .icb-dot-core {
  transform: scale(1.5);
  box-shadow: 0 0 0 6px rgba(229,55,61,.26), 0 0 22px 6px rgba(229,55,61,.85);
}

/* етикет при hover/активност (desktop) */
.icb-dot-label {
  position: absolute;
  bottom: calc(100% - 6px);
  left: 50%;
  transform: translate(-50%, 4px);
  white-space: nowrap;
  font-size: .74rem;
  font-weight: 600;
  letter-spacing: .01em;
  color: var(--ats-ivory, #F8F5EF);
  background: rgba(10,25,47,.92);
  border: 1px solid rgba(200,164,90,.4);
  border-radius: 8px;
  padding: 5px 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity .18s ease, transform .18s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,.35);
}
.icb-dot:hover .icb-dot-label,
.icb-dot:focus-visible .icb-dot-label,
.icb-dot.is-active .icb-dot-label {
  opacity: 1;
  transform: translate(-50%, 0);
}

@keyframes icbPulse {
  0%   { box-shadow: 0 0 0 5px rgba(229,55,61,.16), 0 0 14px 3px rgba(229,55,61,.5), 0 0 0 0 rgba(229,55,61,.5); }
  70%  { box-shadow: 0 0 0 5px rgba(229,55,61,.16), 0 0 14px 3px rgba(229,55,61,.5), 0 0 0 16px rgba(229,55,61,0); }
  100% { box-shadow: 0 0 0 5px rgba(229,55,61,.16), 0 0 14px 3px rgba(229,55,61,.5), 0 0 0 0 rgba(229,55,61,0); }
}
@keyframes icbPop {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(.2); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes icbFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-10px); }
}

/* ── Информационна карта (desktop под тялото) ── */
.icb-panel {
  max-width: 620px;
  margin: 2.6rem auto 0;
  min-height: 210px;
  display: flex;
  justify-content: center;
}
.icb-card {
  position: relative;
  width: 100%;
  background: rgba(248,245,239,.05);
  border: 1px solid rgba(200,164,90,.34);
  border-radius: 18px;
  padding: 2rem 2.2rem 2.2rem;
  text-align: center;
  animation: icbFade .3s ease;
}
.icb-card-empty { border-style: dashed; border-color: rgba(200,164,90,.26); }
.icb-card-eyebrow {
  font-size: .7rem;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: var(--ats-gold-soft, #D8BC85);
  font-weight: 600;
  margin: 0 0 .8rem;
}
.icb-card-title {
  font-family: var(--f-serif, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.7rem, 4vw, 2.2rem);
  font-weight: 600;
  line-height: 1.12;
  color: var(--ats-gold-soft, #D8BC85);
  margin: 0 0 .9rem;
}
.icb-card-text {
  font-size: 1rem;
  line-height: 1.75;
  color: rgba(248,245,239,.84);
  margin: 0 auto;
  max-width: 52ch;
}
.icb-card-close {
  position: absolute;
  top: .8rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(248,245,239,.06);
  color: rgba(248,245,239,.8);
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.icb-card-close:hover { background: rgba(200,164,90,.24); color: #fff; }
.icb-card-close:focus-visible {
  outline: 2px solid var(--ats-gold-soft, #D8BC85);
  outline-offset: 2px;
}

/* ── CTA към запазване на час ── */
.icb-cta {
  display: inline-block;
  margin-top: 1.6rem;
  padding: .85rem 2rem;
  border-radius: 999px;
  font-size: .82rem;
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

@keyframes icbFade {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Bottom sheet (mobile) — скрит на desktop ── */
.icb-sheet-wrap { display: none; }

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

/* ── Mobile ── */
@media (max-width: 860px) {
  .icb-stage { width: min(78vw, 340px); }
  .icb-dot-label { display: none; }
  .icb-panel { display: none; }

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
  .icb-cta { width: 100%; }
}

@keyframes icbSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .icb-stage { animation: none; }
  .icb-dot-core { animation: none; }
  .icb.in .icb-dot { animation: none; opacity: 1; transform: translate(-50%, -50%) scale(1); }
  .icb-dot, .icb-dot-core, .icb-cta, .icb-card, .icb-sheet { transition: none; }
}
`;
