"use client";

import { useEffect, useState } from "react";
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

function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

export function Bold({ data }: { data: SalonData }) {
  const { tenant, gallery } = data;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const primary = tenant.primary_color ?? "#C8102E";

  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const services = servicesFlatForPublic(data);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  function goTo(id: string) {
    setMobileOpen(false);
    document.body.style.overflow = "";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500&display=swap');

        :root {
          --black:   #0D0D0D;
          --dark:    #141414;
          --card:    #1A1A1A;
          --border:  #2A2A2A;
          --red:     ${primary};
          --red-dk:  ${primary}cc;
          --white:   #F0F0F0;
          --muted:   #666666;
          --serif:   'Bebas Neue', sans-serif;
          --sans:    'Inter', sans-serif;
          --trans:   0.25s ease;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--black);
          color: var(--white);
          font-family: var(--sans);
          font-weight: 300;
          line-height: 1.6;
          overflow-x: hidden;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: var(--dark); }
        ::-webkit-scrollbar-thumb { background: var(--red); }
        a { color: inherit; text-decoration: none; }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
        section { padding: 6rem 0; }

        .fade-up { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
        .fade-up.vis { opacity: 1; transform: none; }

        /* NAV */
        .bold-navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: all var(--trans);
        }
        .bold-navbar.scrolled {
          background: rgba(13,13,13,.97);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          font-family: var(--serif);
          font-size: 1.8rem; letter-spacing: .1em;
          color: var(--white); cursor: pointer; line-height: 1;
        }
        .nav-logo span { color: var(--red); }
        .nav-links {
          display: flex; gap: 2.5rem; list-style: none;
          font-size: .68rem; letter-spacing: .2em;
          text-transform: uppercase; color: var(--muted);
        }
        .nav-links a { transition: color var(--trans); cursor: pointer; }
        .nav-links a:hover { color: var(--white); }
        .nav-btn {
          background: var(--red); color: var(--white); border: none;
          padding: .65rem 1.5rem; font-family: var(--sans);
          font-size: .68rem; font-weight: 500; letter-spacing: .15em;
          text-transform: uppercase; cursor: pointer;
          transition: background var(--trans);
          text-decoration: none; display: inline-block;
        }
        .nav-btn:hover { background: var(--red-dk); }
        .hamburger {
          display: none; flex-direction: column; gap: 5px;
          cursor: pointer; background: none; border: none; padding: 4px;
        }
        .hamburger span { display: block; width: 22px; height: 1px; background: var(--white); }

        .mobile-menu {
          display: none; position: fixed; inset: 0; z-index: 99;
          background: var(--black);
          flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-family: var(--serif); font-size: 3rem;
          letter-spacing: .1em; color: var(--white); cursor: pointer;
          transition: color var(--trans);
        }
        .mobile-menu a:hover { color: var(--red); }
        .mobile-close {
          position: absolute; top: 1.5rem; right: 1.5rem;
          background: none; border: none; font-size: 1.5rem;
          color: var(--muted); cursor: pointer;
        }

        /* HERO */
        .hero {
          min-height: 100svh;
          display: grid; grid-template-columns: 1fr 1fr;
          position: relative; overflow: hidden;
        }
        .hero-left {
          display: flex; flex-direction: column;
          justify-content: flex-end;
          padding: 8rem 4rem 5rem 5rem;
          position: relative; z-index: 1;
          background: var(--black);
        }
        .hero-tag {
          font-size: .62rem; letter-spacing: .4em;
          text-transform: uppercase; color: var(--red);
          margin-bottom: 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .hero-tag::before { content: ''; width: 30px; height: 1px; background: var(--red); }
        .hero-title {
          font-family: var(--serif);
          font-size: clamp(4rem, 8vw, 8rem);
          line-height: .95; color: var(--white);
          margin-bottom: 1.5rem; letter-spacing: .02em;
        }
        .hero-title span { color: var(--red); display: block; }
        .hero-desc {
          font-size: .88rem; color: var(--muted);
          max-width: 340px; margin-bottom: 3rem; line-height: 1.8;
        }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .btn-red {
          background: var(--red); color: var(--white); border: none;
          padding: .9rem 2rem; font-family: var(--sans);
          font-size: .72rem; font-weight: 500; letter-spacing: .15em;
          text-transform: uppercase; cursor: pointer;
          transition: background var(--trans);
          text-decoration: none; display: inline-block;
        }
        .btn-red:hover { background: var(--red-dk); }
        .btn-outline-white {
          background: transparent; color: var(--white);
          border: 1px solid var(--border); padding: .9rem 2rem;
          font-family: var(--sans); font-size: .72rem;
          font-weight: 500; letter-spacing: .15em;
          text-transform: uppercase; cursor: pointer;
          transition: all var(--trans); display: inline-block;
          text-decoration: none;
        }
        .btn-outline-white:hover { border-color: var(--white); }
        .hero-right {
          background: var(--card);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .hero-right-placeholder {
          font-family: var(--serif); font-size: 12rem;
          color: rgba(200,16,46,.06); letter-spacing: -.02em;
          user-select: none; line-height: 1;
        }
        .hero-red-line {
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 4px; background: var(--red); z-index: 1;
        }
        .hero-number {
          position: absolute; bottom: 2rem; right: 2rem;
          font-family: var(--serif); font-size: 6rem;
          color: rgba(200,16,46,.06); line-height: 1; user-select: none;
        }

        /* ABOUT */
        .about { background: var(--dark); }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
        .about-img {
          aspect-ratio: 3/4; background: var(--card);
          border-left: 4px solid var(--red);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .about-img-char { font-family: var(--serif); font-size: 8rem; color: rgba(200,16,46,.1); }
        .about-tag {
          font-size: .6rem; letter-spacing: .3em; text-transform: uppercase;
          color: var(--red); margin-bottom: 1rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .about-tag::before { content: ''; width: 24px; height: 1px; background: var(--red); }
        .about-title {
          font-family: var(--serif);
          font-size: clamp(2.5rem, 4vw, 4rem);
          line-height: 1; color: var(--white);
          margin-bottom: 1.5rem; letter-spacing: .02em;
        }
        .about-txt { font-size: .86rem; color: var(--muted); line-height: 1.9; margin-bottom: 1.5rem; }

        /* PRICING */
        .pricing { background: var(--black); }
        .pricing-hdr { text-align: center; margin-bottom: 3.5rem; }
        .section-title {
          font-family: var(--serif);
          font-size: clamp(2.5rem, 5vw, 5rem);
          color: var(--white); letter-spacing: .05em; line-height: 1;
        }
        .section-title span { color: var(--red); }
        .spec-title { font-family: var(--serif); font-size: 1.5rem; color: var(--white); letter-spacing: .05em; margin-bottom: 1.5rem; }
        .price-list { display: flex; flex-direction: column; }
        .price-item {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 1.2rem 0;
          border-bottom: 1px solid var(--border);
          transition: padding-left var(--trans);
        }
        .price-item:last-child { border-bottom: none; }
        .price-item:hover { padding-left: .5rem; }
        .price-left { display: flex; align-items: center; gap: 1rem; }
        .price-dot { width: 6px; height: 6px; background: var(--red); border-radius: 50%; flex-shrink: 0; }
        .price-name { font-size: .95rem; color: var(--white); }
        .price-dur { font-size: .7rem; color: var(--muted); letter-spacing: .05em; }
        .price-right { display: flex; flex-direction: column; align-items: flex-end; gap: .2rem; }
        .price-eur { font-family: var(--serif); font-size: 1.5rem; color: var(--red); letter-spacing: .05em; }
        .price-bgn { font-size: .7rem; color: var(--muted); }

        /* GALLERY */
        .gallery { background: var(--dark); }
        .gallery-hdr { text-align: center; margin-bottom: 3rem; }
        .gallery-mosaic {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: 280px 280px;
          gap: 4px;
        }
        .g-item {
          background: var(--card); overflow: hidden;
          position: relative; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .g-item:first-child { grid-row: span 2; }
        .g-item-inner {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--serif); font-size: 4rem;
          color: rgba(200,16,46,.1); letter-spacing: -.02em;
          transition: transform var(--trans); position: relative;
        }
        .g-item:hover .g-item-inner { transform: scale(1.05); }
        .g-overlay {
          position: absolute; inset: 0;
          background: rgba(200,16,46,.08);
          border: 2px solid transparent;
          opacity: 0; transition: all var(--trans);
        }
        .g-item:hover .g-overlay { opacity: 1; border-color: var(--red); }

        /* BOOKING CTA */
        .booking-cta {
          background: var(--red); padding: 6rem 0;
          text-align: center; position: relative; overflow: hidden;
        }
        .booking-cta::before {
          content: 'ЗАПАЗИ'; position: absolute;
          font-family: var(--serif); font-size: 20vw;
          color: rgba(0,0,0,.1); top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          white-space: nowrap; user-select: none; pointer-events: none; letter-spacing: .05em;
        }
        .cta-title {
          font-family: var(--serif);
          font-size: clamp(2.5rem, 6vw, 5.5rem);
          color: var(--white); line-height: .95;
          margin-bottom: 1.2rem; position: relative; letter-spacing: .02em;
        }
        .cta-sub { font-size: .88rem; color: rgba(240,240,240,.7); margin-bottom: 2.5rem; position: relative; }
        .btn-black {
          background: var(--black); color: var(--white); border: none;
          padding: 1rem 2.5rem; font-family: var(--sans);
          font-size: .75rem; font-weight: 500; letter-spacing: .2em;
          text-transform: uppercase; cursor: pointer;
          transition: background var(--trans); position: relative;
          text-decoration: none; display: inline-block;
        }
        .btn-black:hover { background: var(--dark); }

        /* CONTACT */
        .contact { background: var(--dark); }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
        .contact-title { font-family: var(--serif); font-size: clamp(2rem, 4vw, 3.5rem); color: var(--white); letter-spacing: .02em; line-height: 1; margin-bottom: .5rem; }
        .contact-title span { color: var(--red); }
        .contact-info { margin-top: 2rem; }
        .contact-row { display: flex; gap: 1rem; align-items: flex-start; padding: 1rem 0; border-bottom: 1px solid var(--border); }
        .contact-icon { color: var(--red); flex-shrink: 0; margin-top: 2px; }
        .contact-lbl { font-size: .58rem; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); margin-bottom: .2rem; }
        .contact-val { font-size: .88rem; color: var(--white); line-height: 1.7; }
        .contact-val a { transition: color var(--trans); }
        .contact-val a:hover { color: var(--red); }
        .hours-table { display: flex; flex-direction: column; gap: .3rem; margin-top: .4rem; }
        .hours-row { display: flex; justify-content: space-between; font-size: .82rem; }
        .hours-day { color: var(--muted); }
        .hours-time { color: var(--white); }
        .hours-closed { color: var(--border); }
        .map-wrap {
          border: 1px solid var(--border); aspect-ratio: 4/3;
          overflow: hidden; background: var(--card);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: .8rem; color: var(--muted);
          font-size: .7rem; letter-spacing: .12em; text-transform: uppercase;
        }
        .map-wrap iframe { width: 100%; height: 100%; border: none; filter: grayscale(100%) invert(90%) contrast(85%); }

        /* SOCIAL BAR */
        .social-bar { background: var(--black); border-top: 1px solid var(--border); padding: 1.5rem 0; }
        .social-bar-inner { display: flex; align-items: center; justify-content: center; gap: 2.5rem; }
        .social-link { display: flex; align-items: center; gap: .6rem; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); transition: color var(--trans); }
        .social-link:hover { color: var(--red); }
        .social-div { width: 1px; height: 16px; background: var(--border); }

        /* FOOTER */
        .bold-footer { background: var(--dark); border-top: 1px solid var(--border); padding: 2.5rem 0 2rem; text-align: center; }
        .footer-logo { font-family: var(--serif); font-size: 2rem; color: var(--white); letter-spacing: .1em; margin-bottom: .3rem; }
        .footer-logo span { color: var(--red); }
        .footer-tag { font-size: .58rem; letter-spacing: .25em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.5rem; }
        .footer-nav { display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.5rem; }
        .footer-nav a { transition: color var(--trans); cursor: pointer; }
        .footer-nav a:hover { color: var(--white); }
        .footer-bottom { border-top: 1px solid var(--border); padding-top: 1.2rem; font-size: .64rem; color: var(--muted); display: flex; justify-content: center; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .dot { width: 3px; height: 3px; background: var(--border); border-radius: 50%; display: inline-block; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .about-grid { grid-template-columns: 1fr; gap: 3rem; }
          .contact-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          section { padding: 4rem 0; }
          .nav-links, .nav-btn { display: none; }
          .hamburger { display: flex; }
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 7rem 1.5rem 3rem; }
          .hero-right { display: none; }
          .gallery-mosaic { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .g-item:first-child { grid-row: span 1; }
          .social-bar-inner { gap: 1.2rem; flex-wrap: wrap; }
          .social-div { display: none; }
          .bold-navbar { padding: 1rem; }
        }
        @media (max-width: 480px) {
          .hero-actions { flex-direction: column; }
        }
      `}</style>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        {(tenant.about_text1 || tenant.about_text2) && <a onClick={() => goTo("about")}>За нас</a>}
        <a onClick={() => goTo("pricing")}>Цени</a>
        {gallery.length > 0 && <a onClick={() => goTo("gallery")}>Работа</a>}
        <a onClick={() => goTo("contact")}>Контакти</a>
        <Link className="btn-red" href={`/${tenant.salon_slug}/booking`} onClick={() => setMobileOpen(false)}>
          Запиши се
        </Link>
      </div>

      {/* NAV */}
      <nav className={`bold-navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-logo" onClick={() => goTo("hero")}>
          {tenant.salon_name}<span>.</span>
        </div>
        <ul className="nav-links">
          {(tenant.about_text1 || tenant.about_text2) && <li><a onClick={() => goTo("about")}>За нас</a></li>}
          <li><a onClick={() => goTo("pricing")}>Цени</a></li>
          {gallery.length > 0 && <li><a onClick={() => goTo("gallery")}>Работа</a></li>}
          <li><a onClick={() => goTo("contact")}>Контакти</a></li>
        </ul>
        <Link className="nav-btn" href={`/${tenant.salon_slug}/booking`}>Запиши се</Link>
        <button className="hamburger" onClick={() => setMobileOpen(true)}>
          <span /><span /><span />
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-left">
          <p className="hero-tag">{tenant.salon_name}</p>
          <h1 className="hero-title">
            {tenant.hero_title ?? "ТВОЯТ"}
            <span>{tenant.hero_subtitle ?? "СТИЛ."}</span>
          </h1>
          {tenant.description && (
            <p className="hero-desc">{tenant.description}</p>
          )}
          <div className="hero-actions">
            <Link className="btn-red" href={`/${tenant.salon_slug}/booking`}>Запиши час</Link>
            <button className="btn-outline-white" onClick={() => goTo("pricing")}>Вижте цените</button>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-red-line" />
          {tenant.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.hero_image_url} alt={tenant.salon_name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div className="hero-right-placeholder">✂</div>
          )}
          <div className="hero-number">01</div>
        </div>
      </section>

      {/* ABOUT */}
      {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && (
        <section className="about" id="about">
          <div className="container">
            <div className="about-grid">
              <div className="about-img">
                {tenant.about_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenant.about_image_url} alt="За нас" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="about-img-char">✂</div>
                )}
              </div>
              <div>
                <p className="about-tag">За нас</p>
                <h2 className="about-title">{tenant.salon_name}</h2>
                {tenant.about_text1 && <p className="about-txt">{tenant.about_text1}</p>}
                {tenant.about_text2 && <p className="about-txt">{tenant.about_text2}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="pricing-hdr">
            <h2 className="section-title">ЦЕНО<span>РАЗПИС</span></h2>
          </div>
          {multi ? (
            specs.map((sp) => {
              const list = servicesForSpecialist(data, sp.id);
              if (list.length === 0) return null;
              return (
                <div key={sp.id} style={{ marginBottom: "3rem" }}>
                  <p className="spec-title">{sp.name}</p>
                  <div className="price-list">
                    {list.map((s) => (
                      <div className="price-item" key={s.id}>
                        <div className="price-left">
                          <div className="price-dot" />
                          <div>
                            <div className="price-name">{s.name}</div>
                            <div className="price-dur">
                              {s.is_complex ? "Времето се уточнява" : `${s.duration_minutes ?? 0} мин`}
                            </div>
                          </div>
                        </div>
                        <div className="price-right">
                          <div className="price-eur">{Number(s.price_eur).toFixed(0)} €</div>
                          <div className="price-bgn">≈ {eurToBgn(Number(s.price_eur))} лв</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="price-list">
              {services.map((s) => (
                <div className="price-item" key={s.id}>
                  <div className="price-left">
                    <div className="price-dot" />
                    <div>
                      <div className="price-name">{s.name}</div>
                      <div className="price-dur">
                        {s.is_complex ? "Времето се уточнява" : `${s.duration_minutes ?? 0} мин`}
                      </div>
                    </div>
                  </div>
                  <div className="price-right">
                    <div className="price-eur">{Number(s.price_eur).toFixed(0)} €</div>
                    <div className="price-bgn">≈ {eurToBgn(Number(s.price_eur))} лв</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link className="btn-red" href={`/${tenant.salon_slug}/booking`}>Запиши час</Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="gallery" id="gallery">
          <div className="container">
            <div className="gallery-hdr">
              <h2 className="section-title">НА<span>ШАТА</span> РАБОТА</h2>
            </div>
            <div className="gallery-mosaic">
              {gallery.slice(0, 5).map((g) => (
                <div className="g-item" key={g.id}>
                  <div className="g-item-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="g-overlay" />
                </div>
              ))}
            </div>
            {tenant.instagram_url && (
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <a href={tenant.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-outline-white">
                  Instagram
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* BOOKING CTA */}
      <div className="booking-cta" id="booking">
        <div className="container">
          <h2 className="cta-title">ГОТОВ ЛИ СИ?</h2>
          <p className="cta-sub">Запиши час онлайн — бързо и лесно.</p>
          <Link className="btn-black" href={`/${tenant.salon_slug}/booking`}>ЗАПИШИ ЧАС СЕГА</Link>
        </div>
      </div>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div>
              <h2 className="contact-title">НА<span>МЕ</span>РЕ<span>ТЕ</span> НИ</h2>
              <div className="contact-info">
                {tenant.address && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div><div className="contact-lbl">Адрес</div><div className="contact-val">{tenant.address}</div></div>
                  </div>
                )}
                {tenant.phone && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <div><div className="contact-lbl">Телефон</div><div className="contact-val"><a href={`tel:${tenant.phone}`}>{tenant.phone}</a></div></div>
                  </div>
                )}
                {tenant.email && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <div><div className="contact-lbl">Имейл</div><div className="contact-val"><a href={`mailto:${tenant.email}`}>{tenant.email}</a></div></div>
                  </div>
                )}
                <div className="contact-row">
                  <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <div className="contact-lbl">Работно Време</div>
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
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--red)", opacity: .5 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                  Instagram
                </a>
                {(tenant.facebook_url || tenant.tiktok_url) && <div className="social-div" />}
              </>
            )}
            {tenant.facebook_url && (
              <>
                <a href={tenant.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Facebook
                </a>
                {tenant.tiktok_url && <div className="social-div" />}
              </>
            )}
            {tenant.tiktok_url && (
              <a href={tenant.tiktok_url} target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bold-footer">
        <div className="container">
          <div className="footer-logo">{tenant.salon_name}<span>.</span></div>
          <p className="footer-tag">Premium Studio</p>
          <nav className="footer-nav">
            {(tenant.about_text1 || tenant.about_text2) && <a onClick={() => goTo("about")}>За нас</a>}
            <a onClick={() => goTo("pricing")}>Цени</a>
            {gallery.length > 0 && <a onClick={() => goTo("gallery")}>Работа</a>}
            <a onClick={() => goTo("contact")}>Контакти</a>
          </nav>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {tenant.salon_name}</span>
            <span className="dot" />
            <span>Всички права запазени</span>
            <span className="dot" />
            <a href="https://salonapp.pro" style={{ color: "var(--muted)" }}>SalonApp.pro</a>
          </div>
        </div>
      </footer>
    </>
  );
}
