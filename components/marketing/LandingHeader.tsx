"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const nav = [
  { href: "#audience", label: "За кого" },
  { href: "#features", label: "Продукт" },
  { href: "#templates", label: "Шаблони" },
  { href: "#pricing", label: "Планове" },
  { href: "#how", label: "Старт" },
] as const;

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  function trackCta() {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "cta_click", source: "landing_header" }),
      keepalive: true,
    }).catch(() => undefined);
  }

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-200/80 bg-brand-50/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-brand-900"
          onClick={() => setOpen(false)}
        >
          SalonApp<span className="text-brand-600">.pro</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium text-brand-800/90 md:flex lg:gap-6" aria-label="Основна навигация">
          {nav.map((item) => (
            <a key={item.href} className="transition hover:text-brand-900" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex sm:gap-3">
          <Link
            href="/admin/login"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-100/80 sm:px-4"
          >
            Вход
          </Link>
          <a
            href="#pricing"
            className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:px-4"
            onClick={trackCta}
          >
            Запази безплатна консултация
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200/90 bg-white text-brand-900 shadow-sm sm:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-nav"
          aria-label={open ? "Затвори менюто" : "Отвори менюто"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div
          id="landing-mobile-nav"
          className="max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-brand-200/80 bg-brand-50 px-4 pb-8 pt-2 shadow-inner sm:hidden"
        >
          <nav className="flex flex-col gap-0" aria-label="Мобилна навигация">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border-b border-brand-100 py-3.5 text-base font-semibold text-brand-900 active:bg-brand-100/50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/admin/login"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-brand-200/90 bg-white px-4 text-base font-semibold text-brand-900 shadow-sm"
              onClick={() => setOpen(false)}
            >
              Вход за клиенти
            </Link>
            <a
              href="#pricing"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-base font-semibold text-white shadow-sm"
              onClick={() => {
                trackCta();
                setOpen(false);
              }}
            >
              Запази безплатна консултация
            </a>
            <Link
              href="/get-started"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-900 px-4 text-base font-semibold text-white"
              onClick={() => {
                trackCta();
                setOpen(false);
              }}
            >
              Остави заявка
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
