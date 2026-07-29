"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV = [
  { label: "Функции", href: "/#features" },
  { label: "Примерни сайтове", href: "/#templates" },
  { label: "Цени", href: "/#plans" },
  { label: "Блог", href: "/blog" },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Затваряме менюто при скрол
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={
          scrolled || open
            ? {
                background: "rgba(250,247,242,0.97)",
                borderBottom: "1px solid #eadfce",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }
            : {}
        }
      >
        <div className="flex w-full items-center justify-between px-6 py-3 lg:px-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
            <Image src="/logo2.png" alt="SalonApp" width={160} height={40} className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[11px] font-bold tracking-[0.12em] text-[#6E6A63] transition hover:text-[#3D1F0A]"
              >
                {label.toUpperCase()}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/admin"
              className="border border-[#1A1A1A] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#181818] transition hover:bg-[#1A1A1A] hover:text-white"
            >
              ВХОД ЗА САЛОНИ
            </Link>
            <Link
              href="/get-started"
              className="bg-[#C79A4B] px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#A6823A]"
            >
              БЕЗПЛАТЕН МЕСЕЦ
            </Link>
          </div>

          {/* Mobile: Burger only */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px]"
              aria-label="Меню"
            >
              <span
                className="block h-[2px] w-6 bg-[#3D1F0A] transition-all duration-300"
                style={open ? { transform: "rotate(45deg) translate(5px, 5px)" } : {}}
              />
              <span
                className="block h-[2px] w-6 bg-[#3D1F0A] transition-all duration-300"
                style={open ? { opacity: 0 } : {}}
              />
              <span
                className="block h-[2px] w-6 bg-[#3D1F0A] transition-all duration-300"
                style={open ? { transform: "rotate(-45deg) translate(5px, -5px)" } : {}}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 flex flex-col lg:hidden"
          style={{ background: "#F8EBDD", paddingTop: 68 }}
        >
          <nav className="flex flex-col px-8 pt-6 gap-0">
            {NAV.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b border-[#E8DDD0] py-5 text-[17px] font-medium tracking-wide text-[#3D1F0A]"
              >
                {label}
              </a>
            ))}
            <a
              href="/admin"
              onClick={() => setOpen(false)}
              className="border-b border-[#E8DDD0] py-5 text-[17px] font-medium tracking-wide text-[#9a8a7a]"
            >
              Вход за салони
            </a>
          </nav>
          <div className="px-8 pt-8">
            <Link
              href="/get-started"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg bg-[#C79A4B] py-4 text-center text-[13px] font-semibold tracking-widest text-white"
            >
              Започни безплатно →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
