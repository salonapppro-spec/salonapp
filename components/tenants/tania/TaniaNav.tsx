"use client";

import { useEffect, useState } from "react";

const LINKS: { href: string; label: string }[] = [
  { href: "#za-nas", label: "За нас" },
  { href: "#cenorazpis", label: "Ценоразпис" },
  { href: "#galeriya", label: "Галерия" },
  { href: "#kontakti", label: "Контакти" },
];

export function TaniaNav({ salonName, phone }: { salonName: string; phone: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`t-nav${scrolled ? " scrolled" : ""}`}>
      <div className="t-nav-inner">
        <a className="t-nav-brand" href="#nachalo" onClick={() => setOpen(false)}>
          <span className="t-nav-brand-mark" aria-hidden="true">Т</span>
          <span className="t-nav-brand-text">{salonName}</span>
        </a>

        <nav className="t-nav-links" aria-label="Основна навигация">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="t-nav-actions">
          {phone && (
            <a className="t-nav-phone" href={`tel:${phone.replace(/\s/g, "")}`}>
              {phone}
            </a>
          )}
          <a className="t-nav-cta" href="#rezervaciya">Запази час</a>
        </div>

        <button
          type="button"
          className="t-burger"
          aria-label={open ? "Затвори менюто" : "Отвори менюто"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={open ? "on" : ""} />
          <span className={open ? "on" : ""} />
        </button>
      </div>

      {open && (
        <div className="t-mobile" role="dialog" aria-label="Меню">
          <nav>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
            <a className="t-mobile-cta" href="#rezervaciya" onClick={() => setOpen(false)}>Запази час</a>
            {phone && (
              <a className="t-mobile-phone" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
