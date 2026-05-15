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
import {
  safeFacebookHref,
  safeGoogleMapsEmbedSrc,
  safeInstagramHref,
  safeTiktokHref,
} from "@/lib/safe-public-urls";

const DAY_LABELS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"] as const;
const BGN_RATE = 1.956;

const DEMO_GALLERY = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=700&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=700&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=700&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=700&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=700&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=700&h=450&fit=crop&q=80",
];

const HERO_PLACEHOLDER =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&h=1100&fit=crop&q=80";

const ABOUT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=700&h=800&fit=crop&q=80";

function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

function fmtDuration(min: number | null): string {
  if (!min) return "—";
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60),
    m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("pe-vis");
          obs.unobserve(el);
        }
      },
      { threshold: 0.07 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function PawPrint({
  size = 120,
  opacity = 0.18,
  style,
}: {
  size?: number;
  opacity?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#6B4C35"
      aria-hidden="true"
      style={{
        position: "absolute",
        pointerEvents: "none",
        userSelect: "none",
        opacity,
        ...style,
      }}
    >
      <ellipse cx="12" cy="16" rx="5.5" ry="4" fill="inherit"/>
      <ellipse cx="5.5" cy="10" rx="2.5" ry="2" transform="rotate(-15 5.5 10)" fill="inherit"/>
      <ellipse cx="9" cy="7.5" rx="2.5" ry="2" transform="rotate(-5 9 7.5)" fill="inherit"/>
      <ellipse cx="13" cy="7" rx="2.5" ry="2" transform="rotate(5 13 7)" fill="inherit"/>
      <ellipse cx="16.5" cy="9" rx="2.5" ry="2" transform="rotate(15 16.5 9)" fill="inherit"/>
    </svg>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useFadeUp();
  const delay = `${index * 0.08}s`;
  return (
    <div
      ref={ref}
      className="pe-service-card pe-fade-up"
      style={{ "--pe-delay": delay } as React.CSSProperties}
    >
      <div className="pe-service-number">0{index + 1}</div>
      <div className="pe-service-name">{service.name}</div>
      <div className="pe-service-sep" />
      <div className="pe-service-meta">
        <div className="pe-service-row">
          <span className="pe-service-label">Цена</span>
          <span className="pe-service-value">
            {(service.price_eur ?? 0).toFixed(0)} € /{" "}
            {eurToBgn(service.price_eur ?? 0)} лв
          </span>
        </div>
        <div className="pe-service-row">
          <span className="pe-service-label">Времетраене</span>
          <span className="pe-service-value">
            {service.is_complex ? "по договаряне" : fmtDuration(service.duration_minutes)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PawEmpire({ data }: { data: SalonData }) {
  const { tenant, gallery, workingHours } = data;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/flatpickr";
    script.onload = () => {
      const el = document.querySelector<HTMLInputElement>('.pe-booking input[type="date"]');
      const fp = (window as unknown as Record<string, unknown>).flatpickr as ((el: HTMLElement, opts: object) => void) | undefined;
      if (el && fp) {
        fp(el, { minDate: "today", dateFormat: "Y-m-d", disableMobile: true });
      }
    };
    document.body.appendChild(script);
    return () => { script.remove(); link.remove(); };
  }, []);

  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const flatServices = servicesFlatForPublic(data);

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  const tkHref = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);
  const hasSocial = Boolean(igHref || fbHref || tkHref);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const isDemo = gallery.length === 0;
  const galleryUrls = isDemo ? DEMO_GALLERY : gallery.map((g) => g.url);

  const heroImg = tenant.hero_image_url?.trim() || HERO_PLACEHOLDER;
  const soloSpec = specs.find((s) => s.bio) ?? null;
  const aboutImg = soloSpec
    ? (soloSpec.avatar_url?.trim() || tenant.about_image_url?.trim() || null)
    : (tenant.about_image_url?.trim() || null);
  const hasAbout = Boolean(soloSpec || tenant.about_text1 || tenant.about_text2 || tenant.about_image_url);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Montserrat:wght@300;400;500;600&display=swap');

        /* ─── RESET & ROOT ─────────────────────────────────────────── */
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{
          background:#2A1B14;
          color:#FAF8F5;
          font-family:'Montserrat',sans-serif;
          font-weight:300;
          line-height:1.7;
          overflow-x:hidden
        }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#1C110D}
        ::-webkit-scrollbar-thumb{background:#C5A059;border-radius:3px}
        a{color:inherit;text-decoration:none}
        img{display:block;max-width:100%}

        /* ─── LAYOUT UTILITIES ─────────────────────────────────────── */
        .pe-wrap{max-width:1160px;margin:0 auto;padding:0 2rem}
        .pe-tag{
          font-family:'Montserrat',sans-serif;
          font-size:.58rem;
          letter-spacing:.35em;
          text-transform:uppercase;
          color:#C5A059;
          font-weight:500
        }
        .pe-divider{display:flex;align-items:center;gap:1rem;margin:.9rem 0 1.4rem}
        .pe-divider-line{flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,.35),transparent)}
        .pe-fade-up{
          opacity:0;
          transform:translateY(26px);
          transition:opacity .7s ease var(--pe-delay,0s),transform .7s ease var(--pe-delay,0s)
        }
        .pe-vis{opacity:1!important;transform:none!important}

        /* ─── BUTTONS ──────────────────────────────────────────────── */
        .pe-btn{
          display:inline-flex;align-items:center;gap:.5rem;
          font-family:'Montserrat',sans-serif;
          font-size:.65rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
          padding:.9rem 2.4rem;border-radius:2px;
          cursor:pointer;border:none;text-decoration:none;
          transition:all .3s ease
        }
        .pe-btn-gold{background:#C5A059;color:#2A1B14}
        .pe-btn-gold:hover{background:#DDB96A;transform:translateY(-2px);box-shadow:0 8px 28px rgba(201,168,76,.35)}
        .pe-btn-outline-gold{background:transparent;color:#C5A059;border:1px solid #C5A059}
        .pe-btn-outline-gold:hover{background:#C5A059;color:#2A1B14;transform:translateY(-2px)}
        .pe-btn-outline-light{background:transparent;color:rgba(245,237,232,.65);border:1px solid rgba(245,237,232,.25)}
        .pe-btn-outline-light:hover{color:#FAF8F5;border-color:rgba(245,237,232,.65)}

        /* ─── NAVBAR ───────────────────────────────────────────────── */
        .pe-nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          padding:1.2rem 2.5rem;
          display:flex;align-items:center;justify-content:space-between;
          transition:all .3s ease
        }
        .pe-nav.scrolled{
          background:rgba(28,5,16,.97);
          backdrop-filter:blur(14px);
          border-bottom:1px solid rgba(201,168,76,.12);
          box-shadow:0 4px 32px rgba(0,0,0,.35);
          padding:.85rem 2.5rem
        }
        .pe-nav-brand{
          display:flex;flex-direction:column;
          font-family:'Cormorant Garamond',Georgia,serif
        }
        .pe-nav-name{font-size:1.45rem;font-weight:600;color:#C5A059;letter-spacing:.06em;line-height:1}
        .pe-nav-sub{
          font-family:'Montserrat',sans-serif;
          font-size:.48rem;letter-spacing:.3em;text-transform:uppercase;
          color:rgba(245,237,232,.35);margin-top:3px
        }
        .pe-nav-links{display:flex;gap:2.5rem;list-style:none}
        .pe-nav-links a{
          font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;
          color:rgba(245,237,232,.55);font-weight:400;
          transition:color .3s ease
        }
        .pe-nav-links a:hover{color:#C5A059}
        .pe-hamburger{
          display:none;flex-direction:column;gap:5px;
          background:none;border:none;cursor:pointer;padding:4px
        }
        .pe-hamburger span{display:block;width:22px;height:1px;background:#C5A059;transition:all .3s ease}

        /* ─── MOBILE OVERLAY ───────────────────────────────────────── */
        .pe-mobile{
          display:none;
          position:fixed;inset:0;z-index:99;
          background:#1C110D;
          flex-direction:column;align-items:center;justify-content:center;gap:2.5rem
        }
        .pe-mobile.open{display:flex}
        .pe-mobile-close{
          position:absolute;top:1.5rem;right:1.8rem;
          background:none;border:none;
          font-family:'Montserrat',sans-serif;
          font-size:.55rem;letter-spacing:.2em;text-transform:uppercase;
          color:rgba(245,237,232,.3);cursor:pointer;
          transition:color .3s ease
        }
        .pe-mobile-close:hover{color:#C5A059}
        .pe-mobile a{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:2.6rem;font-weight:300;
          color:#FAF8F5;letter-spacing:.04em;
          transition:color .3s ease
        }
        .pe-mobile a:hover{color:#C5A059}

        /* ─── HERO ─────────────────────────────────────────────────── */
        .pe-hero{
          min-height:100svh;
          background:#2A1B14;
          position:relative;overflow:hidden;
          display:flex;align-items:center
        }
        .pe-hero-radial{
          position:absolute;inset:0;pointer-events:none;
          background:
            radial-gradient(ellipse 55% 65% at 15% 55%,rgba(42,27,20,.9) 0%,transparent 70%),
            radial-gradient(ellipse 35% 40% at 85% 15%,rgba(201,168,76,.04) 0%,transparent 60%)
        }
        .pe-hero-grid{
          position:absolute;inset:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(201,168,76,.025) 1px,transparent 1px),
            linear-gradient(90deg,rgba(201,168,76,.025) 1px,transparent 1px);
          background-size:64px 64px
        }
        .pe-hero-inner{
          position:relative;z-index:1;
          display:grid;grid-template-columns:1fr 1fr;
          gap:5rem;align-items:center;
          padding:8rem 2rem 4rem;
          max-width:1160px;margin:0 auto;width:100%
        }
        .pe-hero-logo-big{
          height:180px;width:auto;
          object-fit:contain;display:block;
          margin-bottom:2rem
        }
        .pe-hero-title{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:clamp(2.4rem,4.5vw,4.8rem);
          font-weight:300;line-height:1.1;
          color:#FAF8F5;margin-bottom:1.2rem;letter-spacing:-.01em
        }
        .pe-hero-title strong{
          display:block;font-weight:600;font-style:italic;
          color:#C5A059;margin-top:.1em
        }
        .pe-hero-desc{
          font-size:.82rem;
          color:rgba(245,237,232,.45);
          max-width:420px;margin-bottom:2.2rem;line-height:2;font-weight:300
        }
        .pe-hero-actions{display:flex;gap:1rem;flex-wrap:wrap}
        .pe-hero-right{position:relative}
        .pe-hero-frame{position:relative}
        .pe-hero-img{
          width:100%;height:560px;
          object-fit:cover;object-position:center top;
          border-radius:8px;display:block
        }
        .pe-hero-border{
          position:absolute;inset:-10px;
          border:1px solid rgba(201,168,76,.2);
          border-radius:12px;pointer-events:none
        }
        .pe-hero-badge{
          position:absolute;bottom:-1.8rem;left:-1.8rem;
          background:#C5A059;color:#2A1B14;
          padding:1.3rem 1.6rem;border-radius:4px;
          min-width:110px
        }
        .pe-hero-badge-num{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:2.2rem;font-weight:700;line-height:1;display:block
        }
        .pe-hero-badge-lbl{
          font-size:.5rem;letter-spacing:.18em;text-transform:uppercase;
          font-family:'Montserrat',sans-serif;opacity:.75;margin-top:3px;display:block
        }
        .pe-hero-scroll{
          position:absolute;bottom:2.5rem;left:50%;transform:translateX(-50%);
          display:flex;flex-direction:column;align-items:center;gap:.5rem;
          color:rgba(245,237,232,.25);
          font-size:.5rem;letter-spacing:.22em;text-transform:uppercase;
          animation:peScroll 2.2s ease-in-out infinite
        }
        .pe-hero-scroll-line{width:1px;height:44px;background:linear-gradient(to bottom,rgba(201,168,76,.45),transparent)}
        @keyframes peScroll{
          0%,100%{opacity:.25;transform:translateX(-50%) translateY(0)}
          50%{opacity:.6;transform:translateX(-50%) translateY(7px)}
        }

        /* ─── LIGHTBOX ─────────────────────────────────────────────── */
        .pe-lb{
          position:fixed;inset:0;z-index:200;
          background:rgba(0,0,0,.92);
          display:flex;align-items:center;justify-content:center;
          cursor:zoom-out;
          animation:peLbIn .25s ease
        }
        @keyframes peLbIn{from{opacity:0}to{opacity:1}}
        .pe-lb-img{
          max-width:92vw;max-height:88vh;
          object-fit:contain;
          border-radius:4px;
          box-shadow:0 40px 80px rgba(0,0,0,.7);
          pointer-events:none
        }
        .pe-lb-close{
          position:absolute;top:1.5rem;right:1.8rem;
          background:none;border:none;cursor:pointer;
          color:rgba(245,237,232,.4);
          font-size:.55rem;letter-spacing:.22em;text-transform:uppercase;
          font-family:'Montserrat',sans-serif;
          transition:color .2s ease
        }
        .pe-lb-close:hover{color:#C5A059}

        /* ─── ABOUT ────────────────────────────────────────────────── */
        .pe-about{background:#2A1B14;padding:3.5rem 0;position:relative;overflow:hidden}
        .pe-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
        .pe-about-img-wrap{position:relative}
        .pe-about-img{
          width:100%;height:520px;
          object-fit:cover;object-position:center;
          border-radius:16px;display:block;
          border:1px solid rgba(201,168,76,.15)
        }
        .pe-about-title{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:clamp(2rem,3.5vw,3.2rem);
          font-weight:400;line-height:1.2;color:#FAF8F5;
          margin-bottom:1.2rem
        }
        .pe-about-title em{font-style:italic;color:#C5A059}
        .pe-about-role{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:#C5A059;margin-bottom:1rem;font-weight:500}
        .pe-about-txt{font-size:.83rem;color:rgba(245,237,232,.6);line-height:2.1;margin-bottom:1rem;font-weight:300}
        .pe-about-grid--no-img{grid-template-columns:1fr}
        .pe-about-stats{
          display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;
          margin-top:2rem;padding-top:2rem;
          border-top:1px solid rgba(201,168,76,.15)
        }
        .pe-about-stat{text-align:center;padding:.5rem 0}
        .pe-stat-num{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:2.8rem;font-weight:600;color:#C5A059;
          display:block;line-height:1
        }
        .pe-stat-lbl{
          font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;
          color:rgba(245,237,232,.4);margin-top:.4rem;display:block
        }

        /* ─── HYGIENE BANNER ───────────────────────────────────────── */
        .pe-hygiene{
          background:#1C110D;padding:3rem 0;
          position:relative;overflow:hidden
        }
        .pe-hygiene-inner{
          display:flex;align-items:flex-start;gap:3rem;
          position:relative;z-index:1
        }
        .pe-hygiene-icon{
          flex-shrink:0;
          width:68px;height:68px;
          border:1px solid rgba(201,168,76,.3);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:#C5A059
        }
        .pe-hygiene-content{}
        .pe-hygiene-label{
          font-size:.55rem;letter-spacing:.32em;text-transform:uppercase;
          color:#C5A059;opacity:.7;margin-bottom:.8rem;display:block
        }
        .pe-hygiene-text{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:clamp(1rem,1.8vw,1.35rem);
          font-weight:400;font-style:italic;
          color:#FAF8F5;line-height:1.9
        }
        .pe-hygiene-text strong{
          font-style:normal;font-weight:600;color:#C5A059
        }

        /* ─── SERVICES ─────────────────────────────────────────────── */
        .pe-services{background:#2A1B14;padding:3.5rem 0;position:relative;overflow:hidden}
        .pe-services-hdr{text-align:center;margin-bottom:2.5rem}
        .pe-section-title{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:clamp(2rem,3.5vw,3.3rem);
          font-weight:400;color:#FAF8F5
        }
        .pe-section-title em{font-style:italic;color:#C5A059}
        .pe-services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem}
        .pe-spec-title{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:1rem;font-style:italic;color:rgba(245,237,232,.35);
          grid-column:1/-1;margin-top:1.2rem;padding-bottom:.6rem;
          border-bottom:1px solid rgba(201,168,76,.1)
        }
        .pe-service-card{
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(201,168,76,.12);
          border-radius:10px;
          padding:1.8rem 1.6rem;
          position:relative;overflow:hidden;
          transition:all .3s ease;
          cursor:default
        }
        .pe-service-card::after{
          content:'';position:absolute;bottom:0;left:0;right:0;
          height:3px;
          background:linear-gradient(90deg,#9A7A2A,#C5A059,#DDB96A,#C5A059);
          transform:scaleX(0);transform-origin:left;
          transition:transform .35s ease
        }
        .pe-service-card:hover{
          border-color:rgba(201,168,76,.3);
          transform:translateY(-5px);
          box-shadow:0 18px 44px rgba(0,0,0,.4)
        }
        .pe-service-card:hover::after{transform:scaleX(1)}
        .pe-service-number{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:3.5rem;font-weight:300;
          color:rgba(201,168,76,.1);line-height:1;margin-bottom:.3rem
        }
        .pe-service-name{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:1.25rem;font-weight:400;color:#FAF8F5;
          margin-bottom:1rem;line-height:1.3
        }
        .pe-service-sep{
          height:1px;
          background:linear-gradient(to right,rgba(201,168,76,.4),transparent);
          margin-bottom:1rem
        }
        .pe-service-meta{}
        .pe-service-row{
          display:flex;justify-content:space-between;
          align-items:baseline;padding:.35rem 0
        }
        .pe-service-label{font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,237,232,.35)}
        .pe-service-value{font-size:.82rem;color:rgba(245,237,232,.85);font-weight:500}
        .pe-services-cta{text-align:center;margin-top:3rem}

        /* ─── GALLERY ──────────────────────────────────────────────── */
        .pe-gallery{background:#1C110D;padding:3.5rem 0}
        .pe-gallery-hdr{text-align:center;margin-bottom:2rem}
        .pe-gallery-hdr .pe-section-title{color:#FAF8F5}
        .pe-gallery-hdr .pe-section-title em{color:#C5A059}
        .pe-gallery-hdr .pe-tag{opacity:.65}
        .pe-gallery-note{
          margin-top:.9rem;
          display:flex;align-items:center;justify-content:center;gap:.6rem;
          font-size:.58rem;letter-spacing:.1em;
          color:rgba(201,168,76,.45)
        }
        .pe-gallery-dot{
          width:5px;height:5px;background:#C5A059;border-radius:50%;
          animation:peBlink 2s ease-in-out infinite
        }
        @keyframes peBlink{0%,100%{opacity:.25}50%{opacity:1}}
        .pe-gallery-grid{
          display:grid;
          grid-template-columns:repeat(12,1fr);
          grid-template-rows:290px 290px;
          gap:10px
        }
        .pe-g-item{position:relative;overflow:hidden;border-radius:4px;cursor:pointer}
        .pe-g-item:nth-child(1){grid-column:1/6;grid-row:1/3}
        .pe-g-item:nth-child(2){grid-column:6/9;grid-row:1}
        .pe-g-item:nth-child(3){grid-column:9/13;grid-row:1}
        .pe-g-item:nth-child(4){grid-column:6/9;grid-row:2}
        .pe-g-item:nth-child(5){grid-column:9/11;grid-row:2}
        .pe-g-item:nth-child(6){grid-column:11/13;grid-row:2}
        .pe-g-img{
          width:100%;height:100%;
          object-fit:cover;display:block;
          transition:transform .65s ease
        }
        .pe-g-item:hover .pe-g-img{transform:scale(1.07)}
        .pe-g-overlay{
          position:absolute;inset:0;
          background:linear-gradient(to top,rgba(28,5,16,.8) 0%,transparent 55%);
          opacity:0;transition:opacity .3s ease;
          display:flex;align-items:flex-end;padding:1.2rem 1rem
        }
        .pe-g-item:hover .pe-g-overlay{opacity:1}
        .pe-g-label{
          font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;
          color:#C5A059;font-weight:500
        }
        .pe-demo-chip{
          position:absolute;top:.7rem;left:.7rem;
          background:rgba(201,168,76,.12);
          border:1px solid rgba(201,168,76,.28);
          color:#C5A059;
          font-size:.48rem;letter-spacing:.15em;text-transform:uppercase;
          padding:.25rem .55rem;border-radius:2px;
          backdrop-filter:blur(4px)
        }
        .pe-gallery-cta{text-align:center;margin-top:3rem}

        /* ─── BOOKING ──────────────────────────────────────────────── */
        .pe-booking{
          background:#2A1B14;padding:4.5rem 0;
          position:relative;overflow:hidden
        }
        .pe-booking::before{
          content:'';position:absolute;
          top:-40%;right:-15%;
          width:700px;height:700px;
          background:radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 70%);
          pointer-events:none
        }
        .pe-booking-hdr{text-align:center;margin-bottom:2rem;position:relative;z-index:1}
        .pe-booking-title{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:clamp(2rem,4vw,3.6rem);
          font-weight:300;font-style:italic;color:#FAF8F5
        }
        .pe-booking-title strong{font-style:normal;font-weight:600;color:#C5A059}
        .pe-booking-sub{
          font-size:.78rem;color:rgba(245,237,232,.45);margin-top:.8rem
        }

        /* ─── CONTACT ──────────────────────────────────────────────── */
        .pe-contact{background:#2A1B14;padding:3.5rem 0;position:relative;overflow:hidden}
        .pe-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:3.5rem;align-items:start}
        .pe-contact-title{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:clamp(1.8rem,3vw,2.8rem);
          font-weight:400;color:#FAF8F5;margin-bottom:.4rem
        }
        .pe-contact-title em{font-style:italic;color:#C5A059}
        .pe-contact-rows{margin-top:2rem}
        .pe-contact-row{
          display:flex;gap:1rem;align-items:flex-start;
          padding:1rem 0;
          border-bottom:1px solid rgba(245,237,232,.07)
        }
        .pe-contact-ico{
          width:36px;height:36px;flex-shrink:0;
          border:1px solid rgba(245,237,232,.12);border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:rgba(245,237,232,.5)
        }
        .pe-contact-lbl{
          font-size:.53rem;letter-spacing:.2em;text-transform:uppercase;
          color:rgba(245,237,232,.35);margin-bottom:.3rem
        }
        .pe-contact-val{font-size:.85rem;color:rgba(245,237,232,.85);line-height:1.8}
        .pe-contact-val a:hover{color:#C5A059}
        .pe-hours-list{display:flex;flex-direction:column;gap:.3rem}
        .pe-hours-row{display:flex;justify-content:space-between;font-size:.8rem}
        .pe-hours-day{color:rgba(245,237,232,.4)}
        .pe-hours-time{color:rgba(245,237,232,.85);font-weight:400}
        .pe-hours-off{color:rgba(245,237,232,.2);font-style:italic}
        .pe-map-wrap{
          border-radius:12px;overflow:hidden;
          border:1px solid rgba(201,168,76,.15);
          aspect-ratio:1
        }
        .pe-map-wrap iframe{width:100%;height:100%;border:none;display:block}
        .pe-map-empty{
          width:100%;height:100%;
          background:rgba(255,255,255,0.04);
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          gap:.8rem;
          color:rgba(245,237,232,.25);font-size:.6rem;letter-spacing:.15em;text-transform:uppercase
        }

        /* ─── SOCIAL BAR ───────────────────────────────────────────── */
        .pe-social{background:#1C110D;padding:1.5rem 0}
        .pe-social-inner{display:flex;align-items:center;justify-content:center;gap:3rem}
        .pe-social-link{
          display:flex;align-items:center;gap:.5rem;
          font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;
          color:rgba(245,237,232,.35);
          transition:color .3s ease
        }
        .pe-social-link:hover{color:#C5A059}
        .pe-social-sep{width:1px;height:14px;background:rgba(245,237,232,.1)}

        /* ─── FOOTER ───────────────────────────────────────────────── */
        .pe-footer{background:#1C110D;padding:3.5rem 0 2rem}
        .pe-footer-logo{
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:2.2rem;font-weight:600;color:#C5A059;
          letter-spacing:.08em;text-align:center;margin-bottom:.3rem
        }
        .pe-footer-tagline{
          font-size:.52rem;letter-spacing:.3em;text-transform:uppercase;
          color:rgba(245,237,232,.18);text-align:center;margin-bottom:2.2rem
        }
        .pe-footer-nav{
          display:flex;justify-content:center;gap:2.5rem;
          flex-wrap:wrap;margin-bottom:2rem
        }
        .pe-footer-nav a{
          font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;
          color:rgba(245,237,232,.28);transition:color .3s ease
        }
        .pe-footer-nav a:hover{color:#C5A059}
        .pe-footer-bottom{
          border-top:1px solid rgba(245,237,232,.05);
          padding-top:1.5rem;text-align:center;
          font-size:.58rem;color:rgba(245,237,232,.14);
          display:flex;justify-content:center;align-items:center;gap:.6rem;flex-wrap:wrap
        }

        /* ─── RESPONSIVE ───────────────────────────────────────────── */
        @media(max-width:1080px){
          .pe-hero-inner{grid-template-columns:1fr;gap:0;padding:7rem 2rem 3rem}
          .pe-hero-right{display:none}
          .pe-about-grid{grid-template-columns:1fr;gap:2.5rem}
          .pe-contact-grid{grid-template-columns:1fr}
          .pe-gallery-grid{
            grid-template-columns:repeat(2,1fr);
            grid-template-rows:220px 220px 220px
          }
          .pe-g-item:nth-child(1){grid-column:1/2;grid-row:1/3}
          .pe-g-item:nth-child(2){grid-column:2/3;grid-row:1}
          .pe-g-item:nth-child(3){grid-column:2/3;grid-row:2}
          .pe-g-item:nth-child(4){grid-column:1/2;grid-row:3}
          .pe-g-item:nth-child(5){grid-column:2/3;grid-row:3}
          .pe-g-item:nth-child(6){display:none}
        }
        @media(max-width:768px){
          .pe-nav-links,.pe-btn.pe-nav-cta{display:none}
          .pe-hamburger{display:flex}
          .pe-services-grid{grid-template-columns:1fr}
          .pe-about-img{height:280px}
          .pe-hygiene-inner{flex-direction:column;text-align:center;gap:1.5rem}
          .pe-hygiene-icon{margin:0 auto}
          .pe-social-inner{gap:1.4rem;flex-wrap:wrap}
          .pe-social-sep{display:none}
          .pe-gallery-grid{
            grid-template-columns:1fr 1fr;
            grid-template-rows:170px 170px 170px
          }
          .pe-g-item:nth-child(1){grid-column:1/3;grid-row:1}
          .pe-g-item:nth-child(2){grid-column:1;grid-row:2}
          .pe-g-item:nth-child(3){grid-column:2;grid-row:2}
          .pe-g-item:nth-child(4){grid-column:1;grid-row:3}
          .pe-g-item:nth-child(5){grid-column:2;grid-row:3}
          .pe-g-item:nth-child(6){display:none}
          .pe-hero-logo-big{height:130px}
          .pe-about{padding:2.5rem 0}
          .pe-services{padding:2.5rem 0}
          .pe-contact{padding:2.5rem 0}
          .pe-booking{padding:3rem 0}
          .pe-gallery{padding:2.5rem 0}
        }
        @media(max-width:480px){
          .pe-hero-actions{flex-direction:column;align-items:flex-start}
          .pe-nav{padding:1rem 1.2rem}
          .pe-wrap{padding:0 1.2rem}
          .pe-about-stats{grid-template-columns:1fr 1fr}
          .pe-booking form{padding:0 .5rem}
          .pe-hero-logo-big{height:110px}
          .pe-services-grid{gap:.8rem}
          .pe-contact-grid{gap:2rem}
          .pe-footer{padding:2.5rem 0 1.5rem}
          .pe-social-inner{gap:.9rem}
        }

        /* ─── SELECT OPTION FIX ────────────────────────────────────── */
        .pe-booking select{color-scheme:dark}
        .pe-booking select option{background:#2A1B14;color:#FAF8F5}

        /* ─── FLATPICKR THEME OVERRIDES ────────────────────────────── */
        .flatpickr-calendar{
          background:#2A1B14!important;
          border:1px solid rgba(197,160,89,.25)!important;
          box-shadow:0 16px 48px rgba(0,0,0,.5)!important;
          border-radius:10px!important;
          font-family:'Montserrat',sans-serif!important
        }
        .flatpickr-months{background:#2A1B14!important;border-radius:10px 10px 0 0!important}
        .flatpickr-month,.flatpickr-prev-month,.flatpickr-next-month{
          color:#C5A059!important;fill:#C5A059!important
        }
        .flatpickr-prev-month:hover svg,.flatpickr-next-month:hover svg{fill:#DDB96A!important}
        .flatpickr-current-month .flatpickr-monthDropdown-months,
        .flatpickr-current-month input.cur-year{
          color:#FAF8F5!important;background:#2A1B14!important
        }
        .flatpickr-weekday{color:#C5A059!important;opacity:.6;font-size:.58rem!important;letter-spacing:.12em!important}
        .flatpickr-day{
          color:#FAF8F5!important;
          border-radius:6px!important;
          font-size:.78rem!important
        }
        .flatpickr-day:hover,.flatpickr-day.prevMonthDay:hover,.flatpickr-day.nextMonthDay:hover{
          background:rgba(197,160,89,.15)!important;
          border-color:rgba(197,160,89,.3)!important
        }
        .flatpickr-day.selected,.flatpickr-day.selected:hover{
          background:#C5A059!important;
          border-color:#C5A059!important;
          color:#2A1B14!important;font-weight:700!important
        }
        .flatpickr-day.today{border-color:rgba(197,160,89,.5)!important}
        .flatpickr-day.flatpickr-disabled,.flatpickr-day.prevMonthDay,.flatpickr-day.nextMonthDay{
          color:rgba(250,248,245,.2)!important
        }
        .flatpickr-innerContainer{background:#2A1B14!important}
        .flatpickr-rContainer{background:#2A1B14!important}
      `}</style>

      {/* ── LIGHTBOX ───────────────────────────────────────────────── */}
      {lightboxImg && (
        <div className="pe-lb" onClick={() => setLightboxImg(null)}>
          <button className="pe-lb-close" onClick={() => setLightboxImg(null)}>✕ &nbsp;ЗАТВОРИ</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImg} alt="" className="pe-lb-img" />
        </div>
      )}

      {/* ── MOBILE OVERLAY ─────────────────────────────────────────── */}
      <div className={`pe-mobile${mobileOpen ? " open" : ""}`}>
        <button className="pe-mobile-close" onClick={() => setMobileOpen(false)}>
          ✕ &nbsp;ЗАТВОРИ
        </button>
        <a href="#about" onClick={() => setMobileOpen(false)}>За нас</a>
        <a href="#services" onClick={() => setMobileOpen(false)}>Услуги</a>
        <a href="#gallery" onClick={() => setMobileOpen(false)}>Галерия</a>
        <a href="#contact" onClick={() => setMobileOpen(false)}>Контакти</a>
        <a href="#booking" className="pe-btn pe-btn-gold" onClick={() => setMobileOpen(false)}>
          Запиши час
        </a>
      </div>

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className={`pe-nav${scrolled ? " scrolled" : ""}`}>
        <a href="#hero" className="pe-nav-brand">
          {tenant.logo_url?.trim() ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={tenant.logo_url} alt={tenant.salon_name} style={{height:"40px",width:"auto",objectFit:"contain"}} />
          ) : (
            <>
              <span className="pe-nav-name">{tenant.salon_name}</span>
              <span className="pe-nav-sub">Grooming Studio</span>
            </>
          )}
        </a>
        <ul className="pe-nav-links">
          <li><a href="#about">За нас</a></li>
          <li><a href="#services">Услуги</a></li>
          <li><a href="#gallery">Галерия</a></li>
          <li><a href="#contact">Контакти</a></li>
        </ul>
        <a href="#booking" className="pe-btn pe-btn-gold pe-nav-cta">
          Запиши час
        </a>
        <button className="pe-hamburger" onClick={() => setMobileOpen(true)} aria-label="Меню">
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="pe-hero" id="hero">
        <div className="pe-hero-radial" />
        <div className="pe-hero-grid" />
        {/* Pale paw prints */}
        <PawPrint size={160} opacity={0.32} style={{top:"12%",left:"5%",transform:"rotate(-20deg)"}} />
        <PawPrint size={90} opacity={0.22} style={{top:"65%",left:"2%",transform:"rotate(15deg)"}} />
        <div className="pe-hero-inner">
          <div>
            {tenant.logo_url?.trim() ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={tenant.logo_url} alt={tenant.salon_name} className="pe-hero-logo-big" />
            ) : (
              <h1 className="pe-hero-title" style={{marginBottom:"1.6rem"}}>
                {tenant.hero_title ?? "Твоят любимец"}
                <strong>{tenant.hero_subtitle ?? "заслужава лукс"}</strong>
              </h1>
            )}
            <p className="pe-hero-desc">
              {tenant.description ??
                "Професионален груминг салон с нежна грижа и любов. Записвайте часове онлайн — бързо, лесно, удобно."}
            </p>
            <div className="pe-hero-actions">
              <a href="#booking" className="pe-btn pe-btn-gold">Запиши час</a>
              <a href="#services" className="pe-btn pe-btn-outline-light">Вижте услугите</a>
            </div>
          </div>
          <div className="pe-hero-right">
            <div className="pe-hero-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImg} alt={tenant.salon_name} className="pe-hero-img" />
              <div className="pe-hero-border" />
              <div className="pe-hero-badge">
                <span className="pe-hero-badge-num">5 ★</span>
                <span className="pe-hero-badge-lbl">Рейтинг</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pe-hero-scroll">
          <div className="pe-hero-scroll-line" />
          <span>Скрол</span>
        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────────────── */}
      {hasAbout && (
        <section className="pe-about" id="about">
          {/* Pale paw prints */}
          <PawPrint size={200} opacity={0.28} style={{top:"-2rem",right:"2%",transform:"rotate(30deg)"}} />
          <PawPrint size={100} opacity={0.22} style={{bottom:"1rem",left:"1%",transform:"rotate(-10deg)"}} />
          <div className="pe-wrap">
            <div className={`pe-about-grid${aboutImg ? "" : " pe-about-grid--no-img"}`}>
              {/* Text on the LEFT */}
              <div
                className="pe-fade-up"
                style={{ "--pe-delay": "0s" } as React.CSSProperties}
              >
                <p className="pe-tag">За нас</p>
                <div className="pe-divider">
                  <div className="pe-divider-line" />
                </div>
                {soloSpec ? (
                  <>
                    <h2 className="pe-about-title"><em>{soloSpec.name}</em></h2>
                    {soloSpec.role && <p className="pe-about-role">{soloSpec.role}</p>}
                    <p className="pe-about-txt">{soloSpec.bio}</p>
                  </>
                ) : (
                  <>
                    <h2 className="pe-about-title"><em>{tenant.salon_name}</em></h2>
                    {tenant.about_text1 && <p className="pe-about-txt">{tenant.about_text1}</p>}
                    {tenant.about_text2 && <p className="pe-about-txt">{tenant.about_text2}</p>}
                  </>
                )}
              </div>
              {/* Image on the RIGHT */}
              {aboutImg && (
                <div
                  className="pe-about-img-wrap pe-fade-up"
                  style={{ "--pe-delay": "0.15s" } as React.CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aboutImg} alt={soloSpec ? soloSpec.name : tenant.salon_name} className="pe-about-img" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── HYGIENE BANNER ─────────────────────────────────────────── */}
      <div className="pe-hygiene">
        <div className="pe-wrap">
          <div className="pe-hygiene-inner">
            <div className="pe-hygiene-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="pe-hygiene-content">
              <span className="pe-hygiene-label">Включено в цялостна хигиенна подстрижка</span>
              <p className="pe-hygiene-text">
                <strong>Цялостна хигиенна подстрижка включва:</strong>{" "}
                къпане, изсушаване, разресване и оформяне на козината, почистване на интим, уши и
                изрязване на нокти.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SERVICES ───────────────────────────────────────────────── */}
      <section className="pe-services" id="services">
        {/* Pale paw prints */}
        <PawPrint size={150} opacity={0.26} style={{top:"5%",right:"1%",transform:"rotate(25deg)"}} />
        <PawPrint size={80} opacity={0.22} style={{bottom:"5%",left:"3%",transform:"rotate(-30deg)"}} />
        <div className="pe-wrap">
          <div className="pe-services-hdr pe-fade-up">
            <p className="pe-tag">Какво предлагаме</p>
            <div className="pe-divider">
              <div className="pe-divider-line" />
            </div>
            <h2 className="pe-section-title">
              Нашите <em>услуги</em>
            </h2>
          </div>
          <div className="pe-services-grid">
            {multi
              ? specs.map((spec) => {
                  const ss = servicesForSpecialist(data, spec.id);
                  return ss.length > 0 ? (
                    <>
                      <p key={`h-${spec.id}`} className="pe-spec-title">
                        — {spec.name}
                      </p>
                      {ss.map((s, i) => (
                        <ServiceCard key={s.id} service={s} index={i} />
                      ))}
                    </>
                  ) : null;
                })
              : flatServices.map((s, i) => (
                  <ServiceCard key={s.id} service={s} index={i} />
                ))}
          </div>
          <div className="pe-services-cta">
            <a href="#booking" className="pe-btn pe-btn-gold">Запишете час</a>
          </div>
        </div>
      </section>

      {/* ── GALLERY ────────────────────────────────────────────────── */}
      <section className="pe-gallery" id="gallery">
        <div className="pe-wrap">
          <div className="pe-gallery-hdr pe-fade-up">
            <p className="pe-tag">Нашата работа</p>
            <div className="pe-divider">
              <div className="pe-divider-line" style={{background:"linear-gradient(to right,transparent,rgba(201,168,76,.35),transparent)"}} />
            </div>
            <h2 className="pe-section-title">
              Преди и <em>след</em>
            </h2>
            <p className="pe-gallery-note">
              <span className="pe-gallery-dot" />
              {isDemo
                ? "Снимките се зареждат динамично от Галерия в Админ панела"
                : `${gallery.length} снимки от Галерия в Админ панела`}
            </p>
          </div>
          <div className="pe-gallery-grid">
            {galleryUrls.slice(0, 6).map((url, i) => (
              <div
                className="pe-g-item"
                key={i}
                onClick={() => !isDemo && setLightboxImg(url)}
                style={!isDemo ? {cursor:"zoom-in"} : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="pe-g-img" loading="lazy" />
                <div className="pe-g-overlay">
                  <span className="pe-g-label">{isDemo ? "Demo" : tenant.salon_name}</span>
                </div>
                {isDemo && <div className="pe-demo-chip">Demo</div>}
              </div>
            ))}
          </div>
          {igHref && (
            <div className="pe-gallery-cta">
              <a href={igHref} target="_blank" rel="noopener noreferrer" className="pe-btn pe-btn-outline-gold">
                Вижте повече в Instagram ↗
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── BOOKING ────────────────────────────────────────────────── */}
      <div className="pe-booking" id="booking">
        {/* Pale paw prints */}
        <PawPrint size={120} opacity={0.25} style={{top:"10%",left:"2%",transform:"rotate(10deg)"}} />
        <PawPrint size={170} opacity={0.22} style={{bottom:"5%",right:"1%",transform:"rotate(-25deg)"}} />
        <div className="pe-wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="pe-booking-hdr">
            <p className="pe-tag" style={{ opacity: 0.65 }}>Онлайн резервация</p>
            <div className="pe-divider">
              <div className="pe-divider-line" />
            </div>
            <h2 className="pe-booking-title">
              Запишете <strong>час</strong> онлайн
            </h2>
            <p className="pe-booking-sub">
              Попълнете формата и ще получите потвърждение скоро.
            </p>
          </div>
          <InlineBookingForm
            salonSlug={tenant.salon_slug}
            salonName={tenant.salon_name}
            salonPhone={tenant.phone}
            salonAddress={tenant.address}
            salonGoogleMapsEmbed={tenant.google_maps_embed}
            services={flatServices}
            primaryColor="#C5A059"
            textColor="#FAF8F5"
            bgColor="rgba(255,255,255,0.06)"
            isDemo={tenant.salon_slug.startsWith("demo/")}
          />
        </div>
      </div>

      {/* ── CONTACT ────────────────────────────────────────────────── */}
      <section className="pe-contact" id="contact">
        {/* Pale paw prints */}
        <PawPrint size={130} opacity={0.26} style={{top:"8%",right:"2%",transform:"rotate(20deg)"}} />
        <div className="pe-wrap">
          <div className="pe-contact-grid">
            <div>
              <p className="pe-tag">Контакти</p>
              <div className="pe-divider" style={{ justifyContent: "flex-start" }}>
                <div className="pe-divider-line" style={{ maxWidth: "80px" }} />
              </div>
              <h2 className="pe-contact-title">
                Намерете <em>ни</em>
              </h2>
              <div className="pe-contact-rows">
                {tenant.address && (
                  <div className="pe-contact-row">
                    <div className="pe-contact-ico">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <div className="pe-contact-lbl">Адрес</div>
                      <div className="pe-contact-val">{tenant.address}</div>
                    </div>
                  </div>
                )}
                {tenant.phone && (
                  <div className="pe-contact-row">
                    <div className="pe-contact-ico">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <div className="pe-contact-lbl">Телефон</div>
                      <div className="pe-contact-val">
                        <a href={`tel:${tenant.phone}`}>{tenant.phone}</a>
                      </div>
                    </div>
                  </div>
                )}
                {tenant.email && (
                  <div className="pe-contact-row">
                    <div className="pe-contact-ico">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="pe-contact-lbl">Имейл</div>
                      <div className="pe-contact-val">
                        <a href={`mailto:${tenant.email}`}>{tenant.email}</a>
                      </div>
                    </div>
                  </div>
                )}
                {workingHours.length > 0 && (
                  <div className="pe-contact-row">
                    <div className="pe-contact-ico">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="pe-contact-lbl">Работно Време</div>
                      <div className="pe-hours-list">
                        {workingHours
                          .slice()
                          .sort((a, b) => a.day_of_week - b.day_of_week)
                          .map((h) => (
                            <div className="pe-hours-row" key={h.id}>
                              <span className="pe-hours-day">{DAY_LABELS[h.day_of_week]}</span>
                              <span className={h.is_day_off ? "pe-hours-off" : "pe-hours-time"}>
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
              <div className="pe-map-wrap">
                {mapsSrc ? (
                  <iframe
                    src={mapsSrc}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="pe-map-empty">
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.25 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Google Maps</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL BAR ─────────────────────────────────────────────── */}
      {hasSocial && (
        <div className="pe-social">
          <div className="pe-social-inner">
            {igHref && (
              <>
                <a href={igHref} target="_blank" rel="noopener noreferrer" className="pe-social-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  Instagram
                </a>
                {(fbHref || tkHref) && <div className="pe-social-sep" />}
              </>
            )}
            {fbHref && (
              <>
                <a href={fbHref} target="_blank" rel="noopener noreferrer" className="pe-social-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  Facebook
                </a>
                {tkHref && <div className="pe-social-sep" />}
              </>
            )}
            {tkHref && (
              <a href={tkHref} target="_blank" rel="noopener noreferrer" className="pe-social-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
                TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="pe-footer">
        {/* Pale paw prints */}
        <PawPrint size={100} opacity={0.22} style={{top:"1rem",right:"5%",transform:"rotate(15deg)"}} />
        <div className="pe-wrap">
          {tenant.logo_url?.trim() ? (
            <div style={{display:"flex",justifyContent:"center",marginBottom:".5rem"}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tenant.logo_url} alt={tenant.salon_name} style={{height:"56px",width:"auto",objectFit:"contain"}} />
            </div>
          ) : (
            <div className="pe-footer-logo">{tenant.salon_name}</div>
          )}
          <p className="pe-footer-tagline">Професионален Груминг Салон</p>
          <nav className="pe-footer-nav">
            <a href="#about">За нас</a>
            <a href="#services">Услуги</a>
            <a href="#gallery">Галерия</a>
            <a href="#contact">Контакти</a>
            <Link href={`/${tenant.salon_slug}/booking`}>Запиши се</Link>
          </nav>
          <div className="pe-footer-bottom">
            <span>© {new Date().getFullYear()} {tenant.salon_name}</span>
            <span>·</span>
            <span>Всички права запазени</span>
          </div>
        </div>
      </footer>
    </>
  );
}
