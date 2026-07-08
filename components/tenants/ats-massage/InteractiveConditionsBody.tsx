"use client";

import { useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────────
   ATS Studio — Интерактивна секция „Състояния".
   Схематично човешко тяло с пулсиращи точки; при клик/tap се отваря
   карта (desktop) или bottom sheet (mobile) с описание на състоянието.
   Всички текстове остават в DOM (визуално скрит SEO списък), точките
   са <button> с aria-label и работят с клавиатура.
   Използва наследените CSS променливи от .ats-root (--ats-gold и т.н.).
   ──────────────────────────────────────────────────────────────── */

export type BodyCondition = {
  id: string;
  title: string;
  description: string;
  /** Позиция в проценти спрямо контейнера на тялото (0–100). */
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
    positionPercentY: 6,
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
    positionPercentX: 65,
    positionPercentY: 19,
  },
  {
    id: "spazmi",
    title: "Мускулни спазми и скованост",
    description:
      "Локалните спазми и сковаността в раменете ограничават ежедневието. Целенасочените техники ги разпускат и връщат подвижността.",
    positionPercentX: 35,
    positionPercentY: 20,
  },
  {
    id: "grab",
    title: "Болки в гърба",
    description:
      "Комбинирам класически и дълбокотъканен масаж, за да облекча болката, да отпусна мускулните вериги и да подобря стойката.",
    positionPercentX: 50,
    positionPercentY: 30,
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
    positionPercentY: 45,
  },
  {
    id: "ishias",
    title: "Ишиас",
    description:
      "Болка по хода на седалищния нерв, която слиза към крака. Работя върху мускулатурата на кръста и таза, за да намаля притискането и да облекча острата симптоматика.",
    positionPercentX: 40,
    positionPercentY: 50,
  },
  {
    id: "celulit",
    title: "Целулит",
    description:
      "Антицелулитният масаж подобрява микроциркулацията и тонуса на тъканите като част от последователна терапия.",
    positionPercentX: 61,
    positionPercentY: 61,
  },
  {
    id: "sport",
    title: "Възстановяване след спорт",
    description:
      "След натоварване или травма помагам на мускулите да се възстановят по-бързо, да намаля болезнеността и да върна тонуса.",
    positionPercentX: 39,
    positionPercentY: 66,
  },
  {
    id: "kravoobrashtenie",
    title: "Лошо кръвообращение",
    description:
      "Масажът активира кръвотока, подхранва тъканите и подпомага естественото възстановяване на тялото.",
    positionPercentX: 60,
    positionPercentY: 80,
  },
  {
    id: "limfen-zastoi",
    title: "Лимфен застой и отоци",
    description:
      "Ръчният лимфен дренаж стимулира оттичането на лимфата, намалява отоците и усещането за тежест в крайниците.",
    positionPercentX: 43,
    positionPercentY: 92,
  },
];

export function InteractiveConditionsBody() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = CONDITIONS.find((c) => c.id === activeId) ?? null;

  const lastFocused = useRef<HTMLButtonElement | null>(null);
  const sheetCloseRef = useRef<HTMLButtonElement | null>(null);

  const open = (id: string, el: HTMLButtonElement) => {
    lastFocused.current = el;
    setActiveId((cur) => (cur === id ? null : id));
  };

  const close = () => {
    setActiveId(null);
    // Върни фокуса към точката, която е била отворена (достъпност).
    lastFocused.current?.focus();
  };

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
      // само ако sheet-ът е видим (mobile) — фокусът е безвреден и на desktop.
      sheetCloseRef.current.focus({ preventScroll: true });
    }
  }, [active]);

  return (
    <div className="icb">
      <p className="icb-helper">
        Докоснете точките по тялото, за да видите как масажът може да помогне.
      </p>

      <div className="icb-layout">
        {/* ── Схематично тяло с точки ── */}
        <div className="icb-stage">
          <svg
            className="icb-figure"
            viewBox="0 0 200 480"
            role="img"
            aria-label="Схематично човешко тяло с обозначени зони на болка"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient
                id="icbBodyFill"
                x1="0"
                y1="0"
                x2="0"
                y2="480"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="rgba(216,188,133,0.24)" />
                <stop offset="1" stopColor="rgba(200,164,90,0.09)" />
              </linearGradient>
            </defs>

            <g className="icb-body">
              {/* глава */}
              <circle cx="100" cy="40" r="26" />
              {/* врат */}
              <rect x="92" y="60" width="16" height="20" rx="7" />
              {/* торс */}
              <path d="M64 88 C 62 80 70 74 82 74 L 118 74 C 130 74 138 80 136 88 L 122 168 L 129 246 L 71 246 L 78 168 Z" />
              {/* ръце */}
              <path
                className="icb-limb"
                d="M67 92 L 51 236"
              />
              <path
                className="icb-limb"
                d="M133 92 L 149 236"
              />
              {/* крака */}
              <path className="icb-limb icb-leg" d="M86 250 L 82 460" />
              <path className="icb-limb icb-leg" d="M114 250 L 118 460" />
              {/* лек намек за гръбначен стълб */}
              <line
                className="icb-spine"
                x1="100"
                y1="82"
                x2="100"
                y2="242"
              />
            </g>
          </svg>

          {/* Точки — абсолютно позиционирани спрямо .icb-stage */}
          <div className="icb-dots">
            {CONDITIONS.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`icb-dot${isActive ? " is-active" : ""}`}
                  style={{
                    left: `${c.positionPercentX}%`,
                    top: `${c.positionPercentY}%`,
                  }}
                  aria-label={c.title}
                  aria-pressed={isActive}
                  onClick={(e) => open(c.id, e.currentTarget)}
                >
                  <span className="icb-dot-core" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Desktop: странична карта ── */}
        <aside className="icb-aside" aria-live="polite">
          {active ? (
            <div className="icb-card">
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
            </div>
          ) : (
            <div className="icb-card icb-card-empty">
              <p className="icb-card-eyebrow">Как работи</p>
              <p className="icb-card-text">
                Изберете точка по тялото, за да видите с кое състояние работя и
                как терапевтичният масаж може да помогне в тази зона.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Mobile: bottom sheet ── */}
      {active && (
        <div
          className="icb-sheet-wrap"
          onClick={close}
          role="presentation"
        >
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
  font-size: .92rem;
  line-height: 1.6;
  color: rgba(248,245,239,.66);
  margin: 0 auto 2.6rem;
  max-width: 46ch;
}

.icb-layout {
  display: flex;
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: center;
  justify-content: center;
}

/* ── Тяло ── */
.icb-stage {
  position: relative;
  flex: 0 0 auto;
  height: min(66vh, 560px);
  aspect-ratio: 200 / 480;
}
.icb-figure {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 0 26px rgba(200,164,90,.14));
}
.icb-body { fill: url(#icbBodyFill); }
.icb-body circle,
.icb-body rect,
.icb-body path:not(.icb-limb) {
  stroke: rgba(200,164,90,.42);
  stroke-width: 1.4;
}
.icb-limb {
  fill: none;
  stroke: url(#icbBodyFill);
  stroke-width: 22;
  stroke-linecap: round;
}
.icb-leg { stroke-width: 30; }
.icb-spine {
  stroke: rgba(216,188,133,.30);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 2 7;
}

/* ── Точки ── */
.icb-dots { position: absolute; inset: 0; }
.icb-dot {
  position: absolute;
  width: 44px;
  height: 44px;
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
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 32%, #ff8f8f 0%, #e0484d 55%, #c0343a 100%);
  box-shadow: 0 0 9px 2px rgba(224,72,77,.5);
  transition: transform .2s ease, box-shadow .2s ease;
  animation: icbPulse 2.4s ease-out infinite;
}
.icb-dot:hover .icb-dot-core,
.icb-dot:focus-visible .icb-dot-core {
  transform: scale(1.35);
  box-shadow: 0 0 12px 3px rgba(224,72,77,.6);
}
.icb-dot:focus-visible {
  outline: 2px solid var(--ats-gold-soft, #D8BC85);
  outline-offset: 2px;
  border-radius: 50%;
}
.icb-dot.is-active .icb-dot-core {
  transform: scale(1.55);
  background: radial-gradient(circle at 35% 32%, #ffb0b0 0%, #e34b50 55%, #c0343a 100%);
  box-shadow: 0 0 0 4px rgba(224,72,77,.22), 0 0 16px 4px rgba(224,72,77,.7);
}

@keyframes icbPulse {
  0%   { box-shadow: 0 0 9px 2px rgba(224,72,77,.5), 0 0 0 0 rgba(224,72,77,.45); }
  70%  { box-shadow: 0 0 9px 2px rgba(224,72,77,.5), 0 0 0 13px rgba(224,72,77,0); }
  100% { box-shadow: 0 0 9px 2px rgba(224,72,77,.5), 0 0 0 0 rgba(224,72,77,0); }
}
@media (prefers-reduced-motion: reduce) {
  .icb-dot-core { animation: none; }
  .icb-dot-core, .icb-dot:hover .icb-dot-core { transition: none; }
  .icb-sheet { animation: none; }
}

/* ── Странична карта (desktop) ── */
.icb-aside {
  flex: 1 1 auto;
  max-width: 400px;
  min-height: 260px;
  display: flex;
  align-items: center;
}
.icb-card {
  position: relative;
  width: 100%;
  background: rgba(248,245,239,.05);
  border: 1px solid rgba(200,164,90,.32);
  border-radius: 16px;
  padding: 2rem 2rem 2.1rem;
  animation: icbFade .28s ease;
}
.icb-card-empty { border-style: dashed; border-color: rgba(200,164,90,.24); }
.icb-card-eyebrow {
  font-size: .68rem;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: var(--ats-gold-soft, #D8BC85);
  font-weight: 600;
  margin: 0 0 .7rem;
}
.icb-card-title {
  font-family: var(--f-serif, 'Cormorant Garamond', Georgia, serif);
  font-size: clamp(1.5rem, 3.4vw, 1.9rem);
  font-weight: 600;
  line-height: 1.15;
  color: var(--ats-gold-soft, #D8BC85);
  margin: 0 0 .8rem;
}
.icb-card-text {
  font-size: .96rem;
  line-height: 1.75;
  color: rgba(248,245,239,.82);
  margin: 0;
}
.icb-card-close {
  position: absolute;
  top: .7rem;
  right: .9rem;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: rgba(248,245,239,.06);
  color: rgba(248,245,239,.8);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.icb-card-close:hover { background: rgba(200,164,90,.22); color: #fff; }
.icb-card-close:focus-visible {
  outline: 2px solid var(--ats-gold-soft, #D8BC85);
  outline-offset: 2px;
}

@keyframes icbFade {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Bottom sheet (mobile) — скрит на desktop ── */
.icb-sheet-wrap { display: none; }

/* ── Скрит SEO списък ── */
.icb-seo {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ── Mobile ── */
@media (max-width: 860px) {
  .icb-layout { flex-direction: column; gap: 0; }
  .icb-stage { height: min(62vh, 460px); }
  .icb-aside { display: none; }

  .icb-sheet-wrap {
    display: flex;
    align-items: flex-end;
    position: fixed;
    inset: 0;
    z-index: 80;
    background: rgba(10,25,47,.55);
    backdrop-filter: blur(2px);
    animation: icbFade .2s ease;
  }
  .icb-sheet {
    position: relative;
    width: 100%;
    background: var(--ats-midnight-deep, #0A192F);
    border-top: 2px solid var(--ats-gold, #C8A45A);
    border-radius: 20px 20px 0 0;
    padding: 1.8rem 1.4rem calc(1.8rem + env(safe-area-inset-bottom, 0px));
    max-height: 76vh;
    overflow-y: auto;
    box-shadow: 0 -14px 40px rgba(0,0,0,.4);
    animation: icbSlideUp .3s cubic-bezier(.22,.61,.36,1);
  }
  .icb-sheet-grip {
    display: block;
    width: 42px;
    height: 4px;
    border-radius: 4px;
    background: rgba(248,245,239,.28);
    margin: 0 auto 1.1rem;
  }
  .icb-sheet .icb-card-close { top: 1rem; right: 1rem; }
}

@keyframes icbSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
`;
