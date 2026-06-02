"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={
        scrolled
          ? {
              background: "rgba(250,247,242,0.95)",
              borderBottom: "1px solid #eadfce",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }
          : {}
      }
    >
      <div className="flex w-full items-center justify-between px-8 py-3 lg:px-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo2.png" alt="SalonApp" width={180} height={44} className="h-11 w-auto object-contain" />
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-7 lg:flex">
          {[
            { label: "ФУНКЦИИ", href: "#features" },
            { label: "ПРИМЕРНИ САЙТОВЕ", href: "#templates" },
            { label: "ЦЕНИ", href: "#plans" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-[11px] font-bold tracking-[0.12em] text-[#6E6A63] transition hover:text-[#3D1F0A]"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden border border-[#1A1A1A] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#181818] transition hover:bg-[#1A1A1A] hover:text-white sm:inline-flex"
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
      </div>
    </header>
  );
}
