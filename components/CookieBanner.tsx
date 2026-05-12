"use client";

import { useEffect, useState } from "react";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: "1";
  timestamp: number;
};

export const CONSENT_KEY = "salonapp_cookie_consent";

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== "1") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, marketing: boolean): CookieConsent {
  const consent: CookieConsent = {
    necessary: true,
    analytics,
    marketing,
    version: "1",
    timestamp: Date.now(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent("cookieConsentChange", { detail: consent }));
  return consent;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) setVisible(true);
  }, []);

  if (!visible) return null;

  function acceptAll() {
    saveConsent(true, true);
    setVisible(false);
  }

  function rejectAll() {
    saveConsent(false, false);
    setVisible(false);
  }

  function saveCustom() {
    saveConsent(analytics, marketing);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Настройки за бисквитки"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-[#1A1A1A]/10 bg-[#FAF7F4] shadow-2xl"
    >
      <div className="mx-auto max-w-5xl px-5 py-5">
        {/* Main row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              Настройки за бисквитки
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#1A1A1A]/65">
              Използваме бисквитки, за да осигурим правилното функциониране на
              сайта, да анализираме трафика и да персонализираме съдържанието.
              Задължителните бисквитки не могат да бъдат изключени — те са
              необходими за работата на платформата.{" "}
              <a
                href="/legal/privacy"
                className="underline underline-offset-2 hover:text-[#1A1A1A] transition-colors"
              >
                Политика за поверителност
              </a>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-widest border border-[#1A1A1A]/20 text-[#1A1A1A]/70 hover:border-[#1A1A1A]/40 transition-colors"
            >
              {expanded ? "Скрий" : "Настройки"}
            </button>
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-widest border border-[#1A1A1A]/20 text-[#1A1A1A]/70 hover:border-[#1A1A1A]/40 transition-colors"
            >
              Само задължителни
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
            >
              Приемам всички
            </button>
          </div>
        </div>

        {/* Expanded categories */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-[#1A1A1A]/10 pt-4">
            <CategoryRow
              title="Задължителни бисквитки"
              description="Необходими за работата на сайта — сесия, сигурност, основни функции. Не могат да бъдат изключени."
              checked={true}
              disabled={true}
              onChange={() => {}}
            />
            <CategoryRow
              title="Аналитични бисквитки"
              description="Помагат ни да разберем как посетителите използват сайта (Google Tag Manager, Microsoft Clarity). Не идентифицират лично потребителите."
              checked={analytics}
              disabled={false}
              onChange={setAnalytics}
            />
            <CategoryRow
              title="Маркетингови бисквитки"
              description="Използват се за показване на персонализирани реклами (Facebook Pixel). Могат да проследяват активността ви в различни уебсайтове."
              checked={marketing}
              disabled={false}
              onChange={setMarketing}
            />

            <div className="flex justify-end pt-1">
              <button
                onClick={saveCustom}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-widest bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
              >
                Запази избора
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#1A1A1A]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#1A1A1A]/60">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-1",
          checked ? "bg-[#1A1A1A]" : "bg-[#1A1A1A]/20",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
