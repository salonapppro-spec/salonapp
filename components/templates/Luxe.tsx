"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { SalonData } from "@/types/database";
import {
  activeSpecialists,
  servicesFlatForPublic,
  servicesForSpecialist,
  useSpecialistSectionsOnPublicSite,
} from "@/components/templates/salon-shared";

const DAY_LABELS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"] as const;
const BGN_RATE = 1.956;
const SERVICE_ICONS = ["✦", "◈", "◇", "◉", "✧", "⬡"] as const;

function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function ServiceCard({ name, durationMinutes, priceEur, isComplex, icon }: {
  name: string;
  durationMinutes: number | null;
  priceEur: number;
  isComplex: boolean;
  icon: string;
}) {
  const ref = useFadeUp();
  return (
    <div ref={ref} className="service-card fade-up">
      <div className="service-icon-char">{icon}</div>
      <div className="service-name">{name}</div>
      <p className="service-desc">
        {isComplex ? "Времето се уточнява" : `${durationMinutes ?? 0} мин`}
      </p>
      <div className="service-prices">
        <div className="price-row">
          <span>Цена</span>
          <span>{Number(priceEur).toFixed(0)} €</span>
        </div>
        <div className="price-row">
          <span>≈ лева</span>
          <span>{eurToBgn(Number(priceEur))} лв</span>
        </div>
      </div>
    </div>
  );
}

export function Luxe({ data }: { data: SalonData }) {
  const { tenant, gallery } = data;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const gold = tenant.primary_color ?? "#c9a84c";

  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const services = servicesFlatForPublic(data);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  function scrollTo(id: string) {
    setMobileOpen(false);
    document.body.style.overflow = "";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        :root {
          --black:   #0a0a0a;
          --dark:    #111111;
          --card:    #181818;
          --border:  #2a2a2a;
          --gold:    ${gold};
          --gold-lt: #e2c97e;
          --gold-dk: #8a6a20;
          --cream:   #f5ede0;
          --muted:   #888888;
          --text:    #e8e0d4;
          --serif:   'Cormorant Garamond', Georgia, serif;
          --sans:    'Jost', sans-serif;
          --trans:   0.35s cubic-bezier(0.4,0,0.2,1);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; font-size: 16px; }

        body {
          background: var(--black);
          color: var(--text);
          font-family: var(--sans);
          font-weight: 300;
          line-height: 1.7;
          overflow-x: hidden;
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--dark); }
        ::-webkit-scrollbar-thumb { background: var(--gold-dk); border-radius: 3px; }

        img { display: block; width: 100%; height: 100%; object-fit: cover; }
        a { color: inherit; text-decoration: none; }

        .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
        section { padding: 6rem 0; }

        .section-tag {
          font-size: .62rem;
          letter-spacing: .28em;
          text-transform: uppercase;
          color: var(--gold);
          font-family: var(--sans);
          font-weight: 500;
        }

        .divider {
          width: 40px; height: 1px;
          background: linear-gradient(90deg, var(--gold), transparent);
          margin: .9rem 0 1.4rem;
        }
        .divider-center { margin-left: auto; margin-right: auto; }

        .btn {
          display: inline-block;
          padding: .85rem 2.2rem;
          border: 1px solid var(--gold);
          color: var(--gold);
          font-family: var(--sans);
          font-size: .73rem;
          font-weight: 500;
          letter-spacing: .18em;
          text-transform: uppercase;
          transition: background var(--trans), color var(--trans);
          cursor: pointer;
          background: transparent;
          text-decoration: none;
        }
        .btn:hover { background: var(--gold); color: var(--black); }
        .btn-solid { background: var(--gold); color: var(--black); }
        .btn-solid:hover { background: var(--gold-lt); border-color: var(--gold-lt); }

        .fade-up {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity .7s ease, transform .7s ease;
        }
        .fade-up.visible { opacity: 1; transform: none; }

        /* NAV */
        .luxe-navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.4rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: background var(--trans), border-color var(--trans);
        }
        .luxe-navbar.scrolled {
          background: rgba(10,10,10,.94);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          font-family: var(--serif);
          font-size: 1.55rem;
          font-weight: 300;
          letter-spacing: .06em;
          color: var(--cream);
          cursor: pointer;
        }
        .nav-logo span { color: var(--gold); }
        .nav-links {
          display: flex; gap: 2.5rem; list-style: none;
          font-size: .7rem;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .nav-links a { transition: color var(--trans); cursor: pointer; }
        .nav-links a:hover { color: var(--gold); }
        .nav-cta { display: flex; align-items: center; gap: 1.2rem; }

        .hamburger {
          display: none;
          flex-direction: column; gap: 5px;
          cursor: pointer; padding: 4px; background: none; border: none;
        }
        .hamburger span {
          display: block; width: 24px; height: 1px;
          background: var(--gold);
          transition: transform var(--trans), opacity var(--trans);
        }

        .mobile-menu {
          display: none;
          position: fixed; inset: 0; z-index: 99;
          background: rgba(10,10,10,.97);
          flex-direction: column;
          align-items: center; justify-content: center;
          gap: 2.5rem;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-family: var(--serif);
          font-size: 2rem;
          font-weight: 300;
          color: var(--cream);
          letter-spacing: .05em;
          transition: color var(--trans);
          cursor: pointer;
        }
        .mobile-menu a:hover { color: var(--gold); }

        /* HERO */
        .hero {
          position: relative;
          min-height: 100svh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .hero-left {
          display: flex; flex-direction: column; justify-content: center;
          padding: 8rem 4rem 6rem 6rem;
          position: relative; z-index: 1;
        }
        .hero-eyebrow {
          font-size: .6rem;
          letter-spacing: .38em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 1.8rem;
        }
        .hero-title {
          font-family: var(--serif);
          font-size: clamp(3rem, 5.5vw, 5.2rem);
          font-weight: 300;
          line-height: 1.06;
          color: var(--cream);
          margin-bottom: 1.5rem;
        }
        .hero-title em { font-style: italic; color: var(--gold); }
        .hero-subtitle {
          font-size: .88rem;
          color: var(--muted);
          max-width: 380px;
          margin-bottom: 3rem;
          line-height: 1.9;
        }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .hero-right { position: relative; overflow: hidden; }
        .hero-img-wrap {
          height: 100%;
          background: linear-gradient(135deg, #1a1208 0%, #0d0d0d 40%, #1c1408 100%);
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, var(--black) 0%, transparent 30%);
        }
        .hero-number {
          position: absolute; bottom: 3rem; right: 3rem;
          font-family: var(--serif);
          font-size: 7rem;
          font-weight: 300;
          color: rgba(201,168,76,.06);
          user-select: none;
        }
        .hero-line {
          position: absolute; left: 0; top: 15%; bottom: 15%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, var(--gold-dk), transparent);
        }
        .hero-placeholder {
          font-family: var(--serif);
          font-size: 5rem;
          color: rgba(201,168,76,.08);
          font-style: italic;
          user-select: none;
        }

        /* ABOUT */
        .about { background: var(--dark); }
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6rem;
          align-items: center;
        }
        .about-img-stack { position: relative; padding-bottom: 2rem; padding-right: 2rem; }
        .about-img-main {
          aspect-ratio: 3/4;
          background: linear-gradient(135deg, #1a1208 0%, #111 60%, #1c1408 100%);
          border: 1px solid var(--border);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .about-img-accent {
          position: absolute;
          bottom: 0; right: 0;
          width: 55%; aspect-ratio: 1;
          background: linear-gradient(135deg, #1c1408, #0d0d0d);
          border: 1px solid var(--gold-dk);
          display: flex; align-items: center; justify-content: center;
        }
        .about-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 3.8vw, 3rem);
          font-weight: 300;
          line-height: 1.15;
          color: var(--cream);
          margin-bottom: 1.5rem;
        }
        .about-title em { font-style: italic; color: var(--gold); }
        .about-text {
          color: var(--muted);
          font-size: .88rem;
          line-height: 1.95;
          margin-bottom: 1rem;
        }
        .img-placeholder-label {
          font-size: .6rem;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: var(--border);
        }

        /* SERVICES */
        .services { background: var(--black); }
        .services-header { text-align: center; margin-bottom: 3.5rem; }
        .services-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 3.8vw, 3rem);
          font-weight: 300;
          color: var(--cream);
        }
        .services-title em { font-style: italic; color: var(--gold); }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }
        .service-card {
          background: var(--dark);
          padding: 2.5rem 2rem;
          position: relative;
          overflow: hidden;
          transition: background var(--trans);
        }
        .service-card::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform var(--trans);
        }
        .service-card:hover { background: var(--card); }
        .service-card:hover::before { transform: scaleX(1); }
        .service-icon-char {
          font-size: 1.4rem;
          color: var(--gold);
          margin-bottom: 1.4rem;
          line-height: 1;
        }
        .service-name {
          font-family: var(--serif);
          font-size: 1.25rem;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: .5rem;
        }
        .service-desc {
          font-size: .8rem;
          color: var(--muted);
          line-height: 1.85;
          margin-bottom: 1.5rem;
        }
        .service-prices {
          border-top: 1px solid var(--border);
          padding-top: 1.1rem;
        }
        .price-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: .38rem 0;
          font-size: .78rem;
        }
        .price-row span:first-child { color: var(--muted); }
        .price-row span:last-child  { color: var(--gold); font-weight: 500; }

        /* GALLERY */
        .gallery { background: var(--dark); }
        .gallery-header { text-align: center; margin-bottom: 3rem; }
        .gallery-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 3.8vw, 3rem);
          font-weight: 300;
          color: var(--cream);
        }
        .gallery-title em { font-style: italic; color: var(--gold); }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 8px;
        }
        .g-item {
          background: var(--card);
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
        }
        .g-item:nth-child(1) { grid-column: span 5; grid-row: span 2; }
        .g-item:nth-child(2) { grid-column: span 4; }
        .g-item:nth-child(3) { grid-column: span 3; }
        .g-item:nth-child(4) { grid-column: span 4; }
        .g-item:nth-child(5) { grid-column: span 3; }
        .g-item:nth-child(6) { grid-column: span 5; }
        .g-item:nth-child(7) { grid-column: span 7; }
        .g-item-inner {
          width: 100%; height: 100%;
          min-height: 220px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #1a1208, #0d0d0d);
          transition: transform var(--trans);
          font-family: var(--serif);
          font-size: 2.5rem;
          color: rgba(201,168,76,.1);
          font-style: italic;
        }
        .g-item:nth-child(1) .g-item-inner { min-height: 460px; }
        .g-item:hover .g-item-inner { transform: scale(1.04); }
        .g-overlay {
          position: absolute; inset: 0;
          background: rgba(201,168,76,.06);
          border: 1px solid rgba(201,168,76,.25);
          opacity: 0;
          transition: opacity var(--trans);
          display: flex; align-items: center; justify-content: center;
        }
        .g-item:hover .g-overlay { opacity: 1; }

        /* BOOKING CTA */
        .booking-cta {
          background: var(--black);
          text-align: center;
          padding: 8rem 0;
          position: relative; overflow: hidden;
        }
        .booking-cta::before {
          content: 'РЕЗЕРВИРАЙ';
          position: absolute;
          font-family: var(--serif);
          font-size: 14vw; font-weight: 300;
          color: rgba(201,168,76,.025);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          pointer-events: none; user-select: none;
        }
        .booking-cta-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 5vw, 3.8rem);
          font-weight: 300;
          color: var(--cream);
          margin-bottom: 1rem;
          position: relative;
        }
        .booking-cta-title em { font-style: italic; color: var(--gold); }
        .booking-cta-sub {
          color: var(--muted);
          font-size: .88rem;
          margin-bottom: 2.5rem;
          position: relative;
        }

        /* CONTACT */
        .contact { background: var(--dark); }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }
        .contact-title {
          font-family: var(--serif);
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 300;
          color: var(--cream);
          margin-bottom: .5rem;
        }
        .contact-title em { font-style: italic; color: var(--gold); }
        .contact-info { margin-top: 2rem; }
        .contact-row {
          display: flex; gap: 1.2rem; align-items: flex-start;
          padding: 1.1rem 0;
          border-bottom: 1px solid var(--border);
        }
        .contact-icon { color: var(--gold); flex-shrink: 0; margin-top: 3px; }
        .contact-label {
          font-size: .6rem;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: .2rem;
        }
        .contact-value { font-size: .88rem; color: var(--cream); line-height: 1.7; }
        .contact-value a { transition: color var(--trans); }
        .contact-value a:hover { color: var(--gold); }
        .hours-table { margin-top: .5rem; display: flex; flex-direction: column; gap: .3rem; }
        .hours-row {
          display: flex; justify-content: space-between;
          font-size: .82rem;
        }
        .hours-day { color: var(--muted); }
        .hours-time { color: var(--cream); }
        .hours-closed { color: var(--border); }
        .map-wrap {
          border: 1px solid var(--border);
          overflow: hidden;
          aspect-ratio: 4/3;
          background: var(--card);
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 1rem;
          color: var(--muted);
          font-size: .72rem;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .map-wrap iframe {
          width: 100%; height: 100%; border: none;
          filter: grayscale(100%) invert(90%) contrast(85%);
        }

        /* SOCIAL BAR */
        .social-bar {
          background: var(--card);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 2rem 0;
        }
        .social-bar-inner {
          display: flex; align-items: center; justify-content: center;
          gap: 2.5rem;
        }
        .social-link {
          display: flex; align-items: center; gap: .7rem;
          font-size: .68rem;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: var(--muted);
          transition: color var(--trans);
        }
        .social-link:hover { color: var(--gold); }
        .social-divider { width: 1px; height: 20px; background: var(--border); }

        /* FOOTER */
        .luxe-footer {
          background: var(--dark);
          padding: 3rem 0 2rem;
          text-align: center;
        }
        .footer-logo {
          font-family: var(--serif);
          font-size: 1.9rem;
          font-weight: 300;
          color: var(--cream);
          letter-spacing: .06em;
          margin-bottom: .4rem;
        }
        .footer-tagline {
          font-size: .62rem;
          letter-spacing: .25em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 2rem;
        }
        .footer-nav {
          display: flex; justify-content: center;
          gap: 2rem; flex-wrap: wrap;
          font-size: .68rem;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 2rem;
        }
        .footer-nav a { transition: color var(--trans); cursor: pointer; }
        .footer-nav a:hover { color: var(--gold); }
        .footer-bottom {
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
          font-size: .68rem;
          color: var(--muted);
          display: flex; justify-content: center;
          align-items: center; gap: .5rem; flex-wrap: wrap;
        }
        .gold-dot {
          display: inline-block;
          width: 4px; height: 4px;
          background: var(--gold);
          border-radius: 50%;
        }

        /* FLOAT BTN */
        .float-btn {
          display: none;
          position: fixed;
          bottom: 1.5rem; left: 50%;
          transform: translateX(-50%);
          z-index: 90;
          background: var(--gold);
          color: var(--black);
          font-family: var(--sans);
          font-size: .68rem;
          font-weight: 500;
          letter-spacing: .2em;
          text-transform: uppercase;
          padding: 1rem 2.5rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 30px rgba(201,168,76,.35);
          white-space: nowrap;
          text-decoration: none;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .about-grid { grid-template-columns: 1fr; gap: 3rem; }
          .about-img-accent { display: none; }
          .about-img-stack { padding: 0; }
          .services-grid { grid-template-columns: 1fr 1fr; }
          .contact-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          section { padding: 4rem 0; }
          .nav-links, .nav-cta { display: none; }
          .hamburger { display: flex; }
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 7rem 1.5rem 3rem; }
          .hero-right { display: none; }
          .services-grid { grid-template-columns: 1fr; }
          .gallery-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
          .g-item { grid-column: span 1 !important; grid-row: span 1 !important; }
          .g-item:nth-child(1) .g-item-inner { min-height: 220px; }
          .float-btn { display: block; }
          .social-bar-inner { gap: 1.2rem; flex-wrap: wrap; }
          .social-divider { display: none; }
        }

        @media (max-width: 480px) {
          .hero-actions { flex-direction: column; }
          .luxe-navbar { padding: 1.2rem 1.2rem; }
        }
      `}</style>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
        <a onClick={() => scrollTo("about")}>За нас</a>
        <a onClick={() => scrollTo("services")}>Услуги</a>
        {gallery.length > 0 && <a onClick={() => scrollTo("gallery")}>Галерия</a>}
        <a onClick={() => scrollTo("contact")}>Контакти</a>
        <Link className="btn btn-solid" href={`/${tenant.salon_slug}/booking`} onClick={() => setMobileOpen(false)}>
          Запишете час
        </Link>
      </div>

      {/* NAV */}
      <nav className={`luxe-navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-logo" onClick={() => scrollTo("hero")}>
          {tenant.salon_name}
        </div>
        <ul className="nav-links">
          <li><a onClick={() => scrollTo("about")}>За нас</a></li>
          <li><a onClick={() => scrollTo("services")}>Услуги</a></li>
          {gallery.length > 0 && <li><a onClick={() => scrollTo("gallery")}>Галерия</a></li>}
          <li><a onClick={() => scrollTo("contact")}>Контакти</a></li>
        </ul>
        <div className="nav-cta">
          <Link className="btn" href={`/${tenant.salon_slug}/booking`}>Резервирай</Link>
        </div>
        <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Меню">
          <span /><span /><span />
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-left">
          <p className="hero-eyebrow">✦ Луксозен Козметичен Салон</p>
          <h1 className="hero-title">
            {tenant.hero_title ? (
              <>{tenant.hero_title}{tenant.hero_subtitle && <><br /><em>{tenant.hero_subtitle}</em></>}</>
            ) : (
              <>{tenant.salon_name}</>
            )}
          </h1>
          {tenant.description && (
            <p className="hero-subtitle">{tenant.description}</p>
          )}
          <div className="hero-actions">
            <Link className="btn btn-solid" href={`/${tenant.salon_slug}/booking`}>
              Запишете час
            </Link>
            <button className="btn" onClick={() => scrollTo("services")}>
              Вижте услугите
            </button>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-img-wrap">
            {tenant.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.hero_image_url} alt={tenant.salon_name} />
            ) : (
              <div className="hero-placeholder">✦</div>
            )}
            <div className="hero-img-overlay" />
          </div>
          <div className="hero-line" />
          <div className="hero-number">01</div>
        </div>
      </section>

      {/* ABOUT */}
      {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && (
        <section className="about" id="about">
          <div className="container">
            <div className="about-grid">
              <div className="about-img-stack">
                <div className="about-img-main">
                  {tenant.about_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tenant.about_image_url} alt="За нас" />
                  ) : (
                    <span className="img-placeholder-label">снимка</span>
                  )}
                </div>
                <div className="about-img-accent">
                  <span className="img-placeholder-label">детайл</span>
                </div>
              </div>
              <div>
                <p className="section-tag">За нас</p>
                <div className="divider" />
                <h2 className="about-title">
                  <em>{tenant.salon_name}</em>
                </h2>
                {tenant.about_text1 && <p className="about-text">{tenant.about_text1}</p>}
                {tenant.about_text2 && <p className="about-text">{tenant.about_text2}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="container">
          <div className="services-header">
            <p className="section-tag">Меню</p>
            <div className="divider divider-center" />
            <h2 className="services-title">
              Нашите <em>услуги</em>
            </h2>
          </div>

          {multi ? (
            specs.map((sp) => {
              const list = servicesForSpecialist(data, sp.id);
              if (list.length === 0) return null;
              return (
                <div key={sp.id} style={{ marginBottom: "3rem" }}>
                  <h3 style={{ fontFamily: "var(--serif)", fontSize: "1.5rem", fontWeight: 300, color: "var(--cream)", marginBottom: "1rem" }}>
                    {sp.name}
                  </h3>
                  <div className="services-grid">
                    {list.map((s, i) => (
                      <ServiceCard
                        key={s.id}
                        name={s.name}
                        durationMinutes={s.duration_minutes}
                        priceEur={Number(s.price_eur)}
                        isComplex={s.is_complex}
                        icon={SERVICE_ICONS[i % SERVICE_ICONS.length]}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="services-grid">
              {services.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  name={s.name}
                  durationMinutes={s.duration_minutes}
                  priceEur={Number(s.price_eur)}
                  isComplex={s.is_complex}
                  icon={SERVICE_ICONS[i % SERVICE_ICONS.length]}
                />
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link className="btn btn-solid" href={`/${tenant.salon_slug}/booking`}>
              Запишете час онлайн
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="gallery" id="gallery">
          <div className="container">
            <div className="gallery-header">
              <p className="section-tag">Портфолио</p>
              <div className="divider divider-center" />
              <h2 className="gallery-title">
                Нашата <em>работа</em>
              </h2>
            </div>
            <div className="gallery-grid">
              {gallery.map((g, i) => (
                <div className="g-item" key={g.id}>
                  <div className="g-item-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt="" loading="lazy" style={{ position: "absolute", inset: 0 }} />
                  </div>
                  <div className="g-overlay">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)", opacity: 0.7 }}>
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            {tenant.instagram_url && (
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <a href={tenant.instagram_url} target="_blank" rel="noopener noreferrer" className="btn">
                  Вижте повече в Instagram
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* BOOKING CTA */}
      <div className="booking-cta" id="booking">
        <div className="container">
          <p className="section-tag" style={{ display: "block", textAlign: "center" }}>Запишете час</p>
          <div className="divider divider-center" />
          <h2 className="booking-cta-title">
            Готова ли сте за<br />
            <em>трансформацията</em>?
          </h2>
          <p className="booking-cta-sub">
            Изберете услуга, дата и час — онлайн, бързо и лесно.
          </p>
          <Link className="btn btn-solid" href={`/${tenant.salon_slug}/booking`}>
            Резервирай онлайн
          </Link>
        </div>
      </div>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div>
              <p className="section-tag">Контакти</p>
              <div className="divider" />
              <h2 className="contact-title">
                Намерете <em>ни</em>
              </h2>
              <div className="contact-info">
                {tenant.address && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <div className="contact-label">Адрес</div>
                      <div className="contact-value">{tenant.address}</div>
                    </div>
                  </div>
                )}
                {tenant.phone && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <div>
                      <div className="contact-label">Телефон</div>
                      <div className="contact-value">
                        <a href={`tel:${tenant.phone}`}>{tenant.phone}</a>
                      </div>
                    </div>
                  </div>
                )}
                {tenant.email && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <div>
                      <div className="contact-label">Имейл</div>
                      <div className="contact-value">
                        <a href={`mailto:${tenant.email}`}>{tenant.email}</a>
                      </div>
                    </div>
                  </div>
                )}
                <div className="contact-row">
                  <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div>
                    <div className="contact-label">Работно Време</div>
                    <div className="hours-table">
                      {data.workingHours.map((wh) => (
                        <div className="hours-row" key={wh.id}>
                          <span className="hours-day">{DAY_LABELS[wh.day_of_week]}</span>
                          <span className={wh.is_day_off ? "hours-closed" : "hours-time"}>
                            {wh.is_day_off ? "Почивен" : `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="map-wrap">
                {tenant.google_maps_embed ? (
                  /* eslint-disable-next-line react/no-danger */
                  <div dangerouslySetInnerHTML={{ __html: tenant.google_maps_embed }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--gold)", opacity: 0.4 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Google Maps</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL BAR */}
      {(tenant.instagram_url || tenant.facebook_url || tenant.tiktok_url) && (
        <div className="social-bar">
          <div className="social-bar-inner">
            {tenant.instagram_url && (
              <>
                <a href={tenant.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  Instagram
                </a>
                {(tenant.facebook_url || tenant.tiktok_url) && <div className="social-divider" />}
              </>
            )}
            {tenant.facebook_url && (
              <>
                <a href={tenant.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  Facebook
                </a>
                {tenant.tiktok_url && <div className="social-divider" />}
              </>
            )}
            {tenant.tiktok_url && (
              <a href={tenant.tiktok_url} target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
                TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="luxe-footer">
        <div className="container">
          <div className="footer-logo">{tenant.salon_name}</div>
          <p className="footer-tagline">✦ Луксозен Козметичен Салон ✦</p>
          <nav className="footer-nav">
            <a onClick={() => scrollTo("about")}>За нас</a>
            <a onClick={() => scrollTo("services")}>Услуги</a>
            {gallery.length > 0 && <a onClick={() => scrollTo("gallery")}>Галерия</a>}
            <a onClick={() => scrollTo("contact")}>Контакти</a>
          </nav>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {tenant.salon_name}</span>
            <span className="gold-dot" />
            <span>Всички права запазени</span>
            <span className="gold-dot" />
            <a href="https://salonapp.pro" style={{ transition: "color var(--trans)" }}>Powered by SalonApp.pro</a>
          </div>
        </div>
      </footer>

      {/* FLOAT BTN (mobile) */}
      <Link className="float-btn" href={`/${tenant.salon_slug}/booking`}>
        ✦ Запишете час
      </Link>
    </>
  );
}
