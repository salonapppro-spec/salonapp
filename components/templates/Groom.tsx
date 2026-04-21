"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { SalonData, Service } from "@/types/database";
import {
  activeSpecialists,
  servicesFlatForPublic,
  servicesForSpecialist,
  useSpecialistSectionsOnPublicSite,
} from "@/components/templates/salon-shared";
import { InlineBookingForm } from "@/components/templates/InlineBookingForm";

const DAY_LABELS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"] as const;
const BGN_RATE = 1.956;
const GROOM_EMOJIS = ["✂️", "🛁", "🐾", "💅", "🎀", "🪮", "🐕", "🐈"];

function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("vis"); obs.unobserve(el); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useFadeUp();
  const emoji = GROOM_EMOJIS[index % GROOM_EMOJIS.length];
  return (
    <div ref={ref} className="service-card fade-up">
      <span className="service-emoji">{emoji}</span>
      <div className="service-name">{service.name}</div>
      <div className="service-prices">
        <div className="price-row">
          <span>Цена</span>
          <span>{(service.price_eur ?? 0).toFixed(0)} € / {eurToBgn(service.price_eur ?? 0)} лв</span>
        </div>
        <div className="price-row">
          <span>Времетраене</span>
          <span>{fmtDuration(service.duration_minutes ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}

export function Groom({ data }: { data: SalonData }) {
  const { tenant, gallery, workingHours } = data;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pawsVisible, setPawsVisible] = useState(false);

  const capu = tenant.primary_color ?? "#C8956A";
  const bg = tenant.background_color ?? "#FDF5ED";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const t = setTimeout(() => setPawsVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const flatServices = servicesFlatForPublic(data);

  const hasSocial = tenant.instagram_url || tenant.facebook_url || tenant.tiktok_url;
  const hasGallery = gallery.length > 0;
  const hasAbout = tenant.about_text1 || tenant.about_text2;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --capu:${capu};
          --capu-lt:color-mix(in srgb,${capu} 70%,white);
          --capu-dk:color-mix(in srgb,${capu} 80%,black);
          --brown:#5C3520;
          --brown-dk:#2C1810;
          --cream:${bg};
          --cream-dk:${bg}ee;
          --cream-bd:${bg}bb;
          --text:#2C1810;
          --muted:#8B6F5E;
          --white:#FFFFFF;
          --serif:'Playfair Display',Georgia,serif;
          --sans:'Nunito',sans-serif;
          --radius:50px;
          --trans:0.3s ease
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{
          background:var(--cream);color:var(--text);font-family:var(--sans);font-weight:400;line-height:1.7;overflow-x:hidden;
          cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='75' rx='20' ry='15' fill='%23C8956A'/%3E%3Cellipse cx='25' cy='45' rx='12' ry='10' fill='%23C8956A'/%3E%3Cellipse cx='75' cy='45' rx='12' ry='10' fill='%23C8956A'/%3E%3Cellipse cx='15' cy='25' rx='9' ry='8' fill='%23C8956A'/%3E%3Cellipse cx='85' cy='25' rx='9' ry='8' fill='%23C8956A'/%3E%3C/svg%3E") 16 16,auto
        }
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:var(--cream)}
        ::-webkit-scrollbar-thumb{background:var(--capu);border-radius:3px}
        a{color:inherit;text-decoration:none}
        .container{max-width:1100px;margin:0 auto;padding:0 1.5rem}
        section{padding:6rem 0}
        .fade-up{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
        .fade-up.vis{opacity:1;transform:none}
        .paw-divider{display:flex;align-items:center;justify-content:center;gap:.5rem;margin:.8rem 0 1.5rem;color:var(--capu);font-size:.9rem;letter-spacing:.3rem}
        .tag{font-size:.62rem;letter-spacing:.28em;text-transform:uppercase;color:var(--capu);font-weight:600}
        .btn-capu{background:var(--capu);color:var(--white);border:none;padding:.9rem 2rem;font-family:var(--sans);font-size:.8rem;font-weight:600;letter-spacing:.08em;cursor:pointer;transition:all var(--trans);border-radius:var(--radius);display:inline-flex;align-items:center;gap:.5rem;text-decoration:none}
        .btn-capu:hover{background:var(--capu-dk);transform:translateY(-2px);box-shadow:0 8px 20px rgba(200,149,106,.3)}
        .btn-outline-brown{background:transparent;color:var(--brown);border:2px solid var(--brown);padding:.9rem 2rem;font-family:var(--sans);font-size:.8rem;font-weight:600;cursor:pointer;transition:all var(--trans);border-radius:var(--radius);display:inline-flex;align-items:center;gap:.5rem;text-decoration:none}
        .btn-outline-brown:hover{background:var(--brown);color:var(--white);transform:translateY(-2px)}
        /* ── NAV ── */
        .navbar{position:fixed;top:0;left:0;right:0;z-index:100;padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;transition:all var(--trans)}
        .navbar.scrolled{background:rgba(253,245,237,.97);backdrop-filter:blur(10px);border-bottom:1px solid var(--cream-bd);box-shadow:0 2px 20px rgba(44,24,16,.08)}
        .nav-logo{font-family:var(--serif);font-size:1.5rem;color:var(--brown-dk);cursor:pointer;display:flex;align-items:center;gap:.4rem}
        .nav-logo span{color:var(--capu);font-style:italic}
        .nav-links{display:flex;gap:2rem;list-style:none;font-size:.78rem;font-weight:500;letter-spacing:.08em;color:var(--muted)}
        .nav-links a{transition:color var(--trans);cursor:pointer}
        .nav-links a:hover{color:var(--capu)}
        .nav-btn{background:var(--capu);color:var(--white);border:none;padding:.65rem 1.4rem;font-family:var(--sans);font-size:.75rem;font-weight:600;cursor:pointer;transition:all var(--trans);border-radius:var(--radius);display:flex;align-items:center;gap:.4rem;text-decoration:none}
        .nav-btn:hover{background:var(--capu-dk)}
        .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px}
        .hamburger span{display:block;width:22px;height:2px;background:var(--brown);border-radius:2px}
        .mobile-menu{display:none;position:fixed;inset:0;z-index:99;background:var(--cream);flex-direction:column;align-items:center;justify-content:center;gap:2rem}
        .mobile-menu.open{display:flex}
        .mobile-menu a{font-family:var(--serif);font-size:2rem;color:var(--brown-dk);cursor:pointer;font-style:italic;transition:color var(--trans)}
        .mobile-menu a:hover{color:var(--capu)}
        .mobile-close{position:absolute;top:1.5rem;right:1.5rem;background:none;border:none;font-size:1.5rem;color:var(--muted);cursor:pointer}
        /* ── HERO ── */
        .hero{min-height:100svh;background:var(--brown-dk);display:flex;align-items:center;position:relative;overflow:hidden;padding:7rem 0 4rem}
        .hero-paws-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden}
        .bg-paw{position:absolute;font-size:4rem;opacity:0;transition:opacity 1s ease,transform 1s ease;transform:translateY(20px)}
        .bg-paw.show{opacity:.06;transform:translateY(0)}
        .bp1{top:10%;left:5%;transition-delay:.1s}
        .bp2{top:20%;right:8%;transition-delay:.3s;font-size:2.5rem}
        .bp3{top:60%;left:3%;transition-delay:.5s;font-size:3rem}
        .bp4{bottom:15%;right:5%;transition-delay:.2s;font-size:5rem}
        .bp5{top:40%;right:20%;transition-delay:.4s;font-size:2rem}
        .bp6{bottom:30%;left:15%;transition-delay:.6s;font-size:3.5rem}
        .hero-inner{max-width:1100px;margin:0 auto;padding:0 1.5rem;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;position:relative;z-index:1}
        .hero-eyebrow{font-size:.65rem;letter-spacing:.3em;text-transform:uppercase;color:var(--capu);margin-bottom:1.5rem;font-weight:600;display:flex;align-items:center;gap:.8rem}
        .hero-title{font-family:var(--serif);font-size:clamp(2.8rem,5vw,4.5rem);font-weight:400;line-height:1.15;color:var(--cream);margin-bottom:1.2rem}
        .hero-title em{font-style:italic;color:var(--capu)}
        .hero-desc{font-size:.95rem;color:rgba(253,245,237,.6);max-width:400px;margin-bottom:2.5rem;line-height:1.9}
        .hero-actions{display:flex;gap:1rem;flex-wrap:wrap}
        .btn-outline-cream{background:transparent;color:var(--cream);border:2px solid rgba(253,245,237,.3);padding:.9rem 2rem;font-family:var(--sans);font-size:.8rem;font-weight:600;cursor:pointer;transition:all var(--trans);border-radius:var(--radius);text-decoration:none;display:inline-flex;align-items:center}
        .btn-outline-cream:hover{border-color:var(--cream)}
        .hero-right{display:flex;align-items:center;justify-content:center;position:relative}
        .hero-dog-circle{width:380px;height:380px;border-radius:50%;background:rgba(200,149,106,.12);border:2px solid rgba(200,149,106,.2);display:flex;align-items:center;justify-content:center;position:relative;animation:float 3s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        .hero-dog-emoji{font-size:9rem}
        .hero-paw-orbit{position:absolute;inset:-20px;animation:orbit 8s linear infinite}
        @keyframes orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .orbit-paw{position:absolute;font-size:1.5rem;top:0;left:50%;transform:translateX(-50%)}
        .hero-paw-bottom{position:absolute;bottom:-2.5rem;left:50%;transform:translateX(-50%);display:flex;gap:.5rem}
        .paw-bounce{font-size:1.8rem;animation:pawBounce 1.5s ease-in-out infinite}
        .paw-bounce:nth-child(2){animation-delay:.2s}
        .paw-bounce:nth-child(3){animation-delay:.4s}
        @keyframes pawBounce{0%,100%{transform:translateY(0) rotate(-10deg);opacity:.5}50%{transform:translateY(-8px) rotate(10deg);opacity:1}}
        /* ── ABOUT ── */
        .about{background:var(--white)}
        .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center}
        .about-img{aspect-ratio:4/5;background:var(--cream-dk);border-radius:40% 60% 60% 40% / 40% 40% 60% 60%;display:flex;align-items:center;justify-content:center;font-size:8rem;position:relative;animation:morphBlob 6s ease-in-out infinite;overflow:hidden}
        .about-img img{width:100%;height:100%;object-fit:cover}
        @keyframes morphBlob{0%,100%{border-radius:40% 60% 60% 40% / 40% 40% 60% 60%}50%{border-radius:60% 40% 40% 60% / 60% 60% 40% 40%}}
        .about-img-tag{position:absolute;bottom:1.5rem;right:-1rem;background:var(--capu);color:var(--white);font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;font-weight:600;padding:.5rem 1.2rem;border-radius:var(--radius)}
        .about-title{font-family:var(--serif);font-size:clamp(1.8rem,3vw,2.8rem);line-height:1.2;color:var(--brown-dk);margin-bottom:1.5rem}
        .about-title em{font-style:italic;color:var(--capu)}
        .about-txt{font-size:.9rem;color:var(--muted);line-height:2;margin-bottom:1rem}
        /* ── SERVICES ── */
        .services{background:var(--cream)}
        .services-hdr{text-align:center;margin-bottom:3.5rem}
        .section-title{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);color:var(--brown-dk)}
        .section-title em{font-style:italic;color:var(--capu)}
        .services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
        .spec-section-title{font-family:var(--serif);font-size:1.1rem;color:var(--muted);margin:2rem 0 .5rem;font-style:italic;grid-column:1/-1}
        .service-card{background:var(--white);padding:2rem;border-radius:20px;border:2px solid var(--cream-bd);transition:all var(--trans);position:relative;overflow:hidden}
        .service-card:hover{border-color:var(--capu);transform:translateY(-4px);box-shadow:0 12px 30px rgba(200,149,106,.15)}
        .service-emoji{font-size:2.5rem;margin-bottom:1rem;display:block}
        .service-name{font-family:var(--serif);font-size:1.2rem;color:var(--brown-dk);margin-bottom:.5rem;font-style:italic}
        .service-prices{border-top:1px solid var(--cream-bd);padding-top:1rem;margin-top:1rem}
        .price-row{display:flex;justify-content:space-between;padding:.35rem 0;font-size:.82rem}
        .price-row span:first-child{color:var(--muted)}
        .price-row span:last-child{color:var(--capu);font-weight:600}
        /* ── GALLERY ── */
        .gallery{background:var(--white)}
        .gallery-hdr{text-align:center;margin-bottom:3rem}
        .gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:250px 250px;gap:12px}
        .g-item{background:var(--cream-dk);overflow:hidden;border-radius:16px;position:relative;display:flex;align-items:center;justify-content:center;font-size:4rem;cursor:pointer;transition:transform var(--trans);border:2px solid var(--cream-bd)}
        .g-item:first-child{grid-row:span 2;font-size:6rem}
        .g-item:hover{transform:scale(1.02);border-color:var(--capu)}
        .g-item img{width:100%;height:100%;object-fit:cover}
        .g-lbl{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(44,24,16,.7),transparent);color:var(--cream);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:600;padding:1.5rem .8rem .7rem;opacity:0;transition:opacity var(--trans)}
        .g-item:hover .g-lbl{opacity:1}
        /* ── BOOKING CTA ── */
        .booking-cta{background:var(--brown-dk);padding:6rem 0;text-align:center;position:relative;overflow:hidden}
        .cta-paws{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20vw;opacity:.03;user-select:none;pointer-events:none}
        .cta-title{font-family:var(--serif);font-size:clamp(2rem,4.5vw,3.8rem);color:var(--cream);margin-bottom:1rem;position:relative;font-style:italic}
        .cta-title em{color:var(--capu);font-style:normal}
        .cta-sub{font-size:.9rem;color:rgba(253,245,237,.55);margin-bottom:2.5rem;position:relative}
        /* ── CONTACT ── */
        .contact{background:var(--white)}
        .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:start}
        .contact-title{font-family:var(--serif);font-size:clamp(1.8rem,3vw,2.8rem);color:var(--brown-dk);margin-bottom:.5rem;font-style:italic}
        .contact-title em{color:var(--capu);font-style:normal}
        .contact-info{margin-top:2rem}
        .contact-row{display:flex;gap:1rem;align-items:flex-start;padding:1rem 0;border-bottom:1px solid var(--cream-bd)}
        .contact-icon{color:var(--capu);flex-shrink:0;margin-top:2px}
        .contact-lbl{font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:.2rem;font-weight:600}
        .contact-val{font-size:.88rem;color:var(--text);line-height:1.7}
        .contact-val a:hover{color:var(--capu)}
        .hours-table{display:flex;flex-direction:column;gap:.3rem;margin-top:.4rem}
        .hours-row{display:flex;justify-content:space-between;font-size:.82rem}
        .hours-day{color:var(--muted)}
        .hours-time{color:var(--text);font-weight:500}
        .hours-closed{color:var(--cream-bd)}
        .map-wrap{border:2px solid var(--cream-bd);aspect-ratio:4/3;overflow:hidden;background:var(--cream);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8rem;color:var(--muted);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase}
        .map-wrap iframe{width:100%;height:100%;border:none}
        /* ── SOCIAL BAR ── */
        .social-bar{background:var(--cream-dk);border-top:1px solid var(--cream-bd);padding:1.8rem 0}
        .social-bar-inner{display:flex;align-items:center;justify-content:center;gap:2.5rem}
        .social-link{display:flex;align-items:center;gap:.6rem;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);transition:color var(--trans);font-weight:500}
        .social-link:hover{color:var(--capu)}
        .social-div{width:1px;height:18px;background:var(--cream-bd)}
        /* ── FOOTER ── */
        footer{background:var(--brown-dk);padding:3rem 0 2rem;text-align:center}
        .footer-logo{font-family:var(--serif);font-size:1.8rem;color:var(--cream);letter-spacing:.04em;margin-bottom:.4rem;font-style:italic}
        .footer-logo span{color:var(--capu)}
        .footer-tag{font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(253,245,237,.35);margin-bottom:2rem}
        .footer-nav{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(253,245,237,.35);margin-bottom:2rem;font-weight:500}
        .footer-nav a{transition:color var(--trans);cursor:pointer;text-decoration:none}
        .footer-nav a:hover{color:var(--capu)}
        .footer-bottom{border-top:1px solid rgba(255,255,255,.08);padding-top:1.5rem;font-size:.66rem;color:rgba(253,245,237,.25);display:flex;justify-content:center;align-items:center;gap:.5rem;flex-wrap:wrap}
        /* ── RESPONSIVE ── */
        @media(max-width:1024px){.about-grid{grid-template-columns:1fr;gap:3rem}.contact-grid{grid-template-columns:1fr}}
        @media(max-width:768px){
          section{padding:4rem 0}
          .nav-links,.nav-btn{display:none}.hamburger{display:flex}
          .hero-inner{grid-template-columns:1fr}.hero-right{display:none}
          .services-grid{grid-template-columns:1fr}
          .gallery-grid{grid-template-columns:1fr 1fr;grid-template-rows:auto}
          .g-item:first-child{grid-row:span 1}
          .social-bar-inner{gap:1.2rem;flex-wrap:wrap}.social-div{display:none}
          .navbar{padding:1rem}
        }
        @media(max-width:480px){.hero-actions{flex-direction:column}}
      `}</style>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        {hasAbout && <a href="#about" onClick={() => setMobileOpen(false)}>За нас</a>}
        <a href="#services" onClick={() => setMobileOpen(false)}>Услуги</a>
        {hasGallery && <a href="#gallery" onClick={() => setMobileOpen(false)}>Галерия</a>}
        <a href="#contact" onClick={() => setMobileOpen(false)}>Контакти</a>
        <a href="#booking" className="btn-capu" onClick={() => setMobileOpen(false)}>
          🐾 Запиши час
        </a>
      </div>

      {/* NAV */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <a href="#hero" className="nav-logo">
          🐾 {tenant.salon_name}
        </a>
        <ul className="nav-links">
          {hasAbout && <li><a href="#about">За нас</a></li>}
          <li><a href="#services">Услуги</a></li>
          {hasGallery && <li><a href="#gallery">Галерия</a></li>}
          <li><a href="#contact">Контакти</a></li>
        </ul>
        <a href="#booking" className="nav-btn">🐾 Запиши час</a>
        <button className="hamburger" onClick={() => setMobileOpen(true)}>
          <span /><span /><span />
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-paws-bg">
          <div className={`bg-paw bp1${pawsVisible ? " show" : ""}`}>🐾</div>
          <div className={`bg-paw bp2${pawsVisible ? " show" : ""}`}>🐾</div>
          <div className={`bg-paw bp3${pawsVisible ? " show" : ""}`}>🐾</div>
          <div className={`bg-paw bp4${pawsVisible ? " show" : ""}`}>🐾</div>
          <div className={`bg-paw bp5${pawsVisible ? " show" : ""}`}>🐾</div>
          <div className={`bg-paw bp6${pawsVisible ? " show" : ""}`}>🐾</div>
        </div>
        <div className="hero-inner">
          <div className="hero-left">
            <p className="hero-eyebrow">🐾 {tenant.salon_name}</p>
            <h1 className="hero-title">
              {tenant.hero_title ?? "Вашият любимец"}<br />
              <em>{tenant.hero_subtitle ?? "заслужава най-доброто"}</em>
            </h1>
            <p className="hero-desc">{tenant.description}</p>
            <div className="hero-actions">
              <a href="#booking" className="btn-capu">🐾 Запиши час</a>
              <a href="#services" className="btn-outline-cream">Вижте услугите</a>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-dog-circle">
              <div className="hero-paw-orbit">
                <div className="orbit-paw">🐾</div>
              </div>
              <span className="hero-dog-emoji">🐕</span>
            </div>
            <div className="hero-paw-bottom">
              <span className="paw-bounce">🐾</span>
              <span className="paw-bounce">🐾</span>
              <span className="paw-bounce">🐾</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      {hasAbout && (
        <section className="about" id="about">
          <div className="container">
            <div className="about-grid">
              <div className="about-img">
                {tenant.about_image_url
                  ? <img src={tenant.about_image_url} alt={tenant.salon_name} />
                  : <span>🐕</span>
                }
                <div className="about-img-tag">Certified Groomer 🐾</div>
              </div>
              <div>
                <p className="tag">За нас</p>
                <div className="paw-divider">🐾 🐾 🐾</div>
                <h2 className="about-title">
                  <em>{tenant.salon_name}</em>
                </h2>
                {tenant.about_text1 && <p className="about-txt">{tenant.about_text1}</p>}
                {tenant.about_text2 && <p className="about-txt">{tenant.about_text2}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="container">
          <div className="services-hdr">
            <p className="tag">Какво предлагаме</p>
            <div className="paw-divider">🐾 🐾 🐾</div>
            <h2 className="section-title">Нашите <em>услуги</em></h2>
          </div>
          <div className="services-grid">
            {multi ? (
              specs.map((spec) => {
                const specServices = servicesForSpecialist(data, spec.id);
                return (
                  <>
                    <p key={`h-${spec.id}`} className="spec-section-title">— {spec.name}</p>
                    {specServices.map((s, i) => (
                      <ServiceCard key={s.id} service={s} index={i} />
                    ))}
                  </>
                );
              })
            ) : (
              flatServices.map((s, i) => (
                <ServiceCard key={s.id} service={s} index={i} />
              ))
            )}
          </div>
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <a href="#booking" className="btn-capu">🐾 Запишете час</a>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      {hasGallery && (
        <section className="gallery" id="gallery">
          <div className="container">
            <div className="gallery-hdr">
              <p className="tag">Нашата работа</p>
              <div className="paw-divider">🐾 🐾 🐾</div>
              <h2 className="section-title">Преди и <em>след</em></h2>
            </div>
            <div className="gallery-grid">
              {gallery.slice(0, 6).map((img, i) => (
                <div className="g-item" key={i}>
                  <img src={img.url} alt="" />
                </div>
              ))}
            </div>
            {tenant.instagram_url && (
              <div style={{ textAlign: "center", marginTop: "2rem" }}>
                <a href={tenant.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-outline-brown">
                  Вижте повече в Instagram
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* BOOKING */}
      <div className="booking-cta" id="booking">
        <div className="cta-paws">🐾</div>
        <div className="container" style={{ position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 className="cta-title">Запишете <em>час</em></h2>
            <p className="cta-sub">Попълнете формата и ще получите потвърждение скоро.</p>
          </div>
          <InlineBookingForm
            salonSlug={tenant.salon_slug}
            services={flatServices}
            primaryColor={capu}
            textColor="#FDF5ED"
            bgColor="rgba(255,255,255,0.08)"
            isDemo={tenant.salon_slug.startsWith("demo/")}
          />
        </div>
      </div>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div>
              <p className="tag">Контакти</p>
              <div className="paw-divider" style={{ justifyContent: "flex-start" }}>🐾 🐾 🐾</div>
              <h2 className="contact-title">Намерете <em>ни</em></h2>
              <div className="contact-info">
                {tenant.address && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div>
                      <div className="contact-lbl">Адрес</div>
                      <div className="contact-val">{tenant.address}</div>
                    </div>
                  </div>
                )}
                {tenant.phone && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <div>
                      <div className="contact-lbl">Телефон</div>
                      <div className="contact-val"><a href={`tel:${tenant.phone}`}>{tenant.phone}</a></div>
                    </div>
                  </div>
                )}
                {tenant.email && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <div>
                      <div className="contact-lbl">Имейл</div>
                      <div className="contact-val"><a href={`mailto:${tenant.email}`}>{tenant.email}</a></div>
                    </div>
                  </div>
                )}
                {workingHours.length > 0 && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div>
                      <div className="contact-lbl">Работно Време</div>
                      <div className="hours-table">
                        {workingHours
                          .slice()
                          .sort((a, b) => a.day_of_week - b.day_of_week)
                          .map((h) => (
                            <div className="hours-row" key={h.id}>
                              <span className="hours-day">{DAY_LABELS[h.day_of_week]}</span>
                              <span className={h.is_day_off ? "hours-closed" : "hours-time"}>
                                {h.is_day_off ? "почивен ден" : `${h.start_time} – ${h.end_time}`}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="map-wrap">
                {tenant.google_maps_embed
                  ? <iframe src={tenant.google_maps_embed} allowFullScreen loading="lazy" />
                  : (
                    <>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--capu)", opacity: .5 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>Google Maps</span>
                    </>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL BAR */}
      {hasSocial && (
        <div className="social-bar">
          <div className="social-bar-inner">
            {tenant.instagram_url && (
              <>
                <a href={tenant.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                  Instagram
                </a>
                <div className="social-div" />
              </>
            )}
            {tenant.facebook_url && (
              <>
                <a href={tenant.facebook_url} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Facebook
                </a>
                <div className="social-div" />
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
      <footer>
        <div className="container">
          <div className="footer-logo">🐾 {tenant.salon_name}</div>
          <p className="footer-tag">🐾 Професионален Груминг Салон 🐾</p>
          <nav className="footer-nav">
            {hasAbout && <a href="#about">За нас</a>}
            <a href="#services">Услуги</a>
            {hasGallery && <a href="#gallery">Галерия</a>}
            <a href="#contact">Контакти</a>
            <Link href={`/${tenant.salon_slug}/booking`}>Запиши се</Link>
          </nav>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {tenant.salon_name}</span>
            <span>·</span>
            <span>Всички права запазени</span>
          </div>
        </div>
      </footer>
    </>
  );
}
