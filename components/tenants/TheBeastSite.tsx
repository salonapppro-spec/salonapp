"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { tenantPublicPath } from "@/lib/routing/public-paths";

import type { SalonData } from "@/types/database";
import { mergeTokens, tokensToCssVars } from "@/lib/design-tokens";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { SalonWorkingHours } from "@/components/templates/SalonWorkingHours";
import {
  safeFacebookHref,
  safeGoogleMapsEmbedSrc,
  safeInstagramHref,
  safeTiktokHref,
} from "@/lib/safe-public-urls";

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("tb-vis"); obs.unobserve(el); } },
      { threshold: 0.07 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/* ── Torn-paper SVG divider ─────────────────────────────── */
function TornDividerDarkToLight() {
  return (
    <div style={{ position: "relative", height: "70px", marginBottom: "-2px", overflow: "hidden" }}>
      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        style={{ position: "absolute", bottom: 0, width: "100%", height: "100%" }}
        aria-hidden="true"
      >
        <path
          d="M0,70 L0,38 C18,42 35,28 58,34 C80,40 95,22 120,26 C145,30 160,44 185,38 C210,32 228,16 252,20 C276,24 290,40 315,36 C340,32 355,14 382,18 C409,22 420,42 448,38 C476,34 490,18 518,22 C546,26 560,46 588,42 C616,38 630,20 658,16 C686,12 700,36 728,32 C756,28 770,10 798,14 C826,18 840,38 868,42 C896,46 910,28 938,24 C966,20 980,40 1008,44 C1036,48 1050,30 1078,26 C1106,22 1120,38 1148,34 C1176,30 1190,12 1218,16 C1246,20 1260,44 1288,40 C1316,36 1330,18 1358,22 C1386,26 1410,44 1440,38 L1440,70 Z"
          fill="#f5f0e8"
        />
      </svg>
    </div>
  );
}

function TornDividerLightToDark() {
  return (
    <div style={{ position: "relative", height: "70px", marginTop: "-2px", overflow: "hidden" }}>
      <svg
        viewBox="0 0 1440 70"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, width: "100%", height: "100%" }}
        aria-hidden="true"
      >
        <path
          d="M0,0 L0,32 C22,28 40,44 65,40 C90,36 108,18 135,22 C162,26 175,44 202,40 C229,36 244,18 272,14 C300,10 315,34 342,38 C369,42 384,24 412,20 C440,16 455,40 482,44 C509,48 524,28 552,24 C580,20 595,42 622,46 C649,50 664,30 692,26 C720,22 735,44 762,48 C789,52 804,32 832,28 C860,24 875,46 902,50 C929,54 944,34 972,30 C1000,26 1015,48 1042,44 C1069,40 1084,20 1112,16 C1140,12 1155,38 1182,42 C1209,46 1224,26 1252,22 C1280,18 1295,40 1322,44 C1349,48 1380,28 1440,32 L1440,0 Z"
          fill="#111111"
        />
      </svg>
    </div>
  );
}

export function TheBeastSite({ data }: { data: SalonData }) {
  const { tenant, gallery } = data;
  const soloBarber = data.specialists?.find(s => s.is_active) ?? null;
  const aboutText = tenant.about_text1 || soloBarber?.bio || null;
  const aboutText2 = tenant.about_text2 || null;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const tokens = mergeTokens(
    (tenant.design_tokens ?? null) as Parameters<typeof mergeTokens>[0]
  );
  const cssVars = tokensToCssVars(tokens);

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  const tkHref = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);
  const hasGallery = gallery.length > 0;
  const hasAbout = Boolean(aboutText || aboutText2 || tenant.about_image_url);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const heroRef = useFadeIn();
  const aboutRef = useFadeIn();
  const servicesRef = useFadeIn();
  const galleryRef = useFadeIn();
  const bookingRef = useFadeIn();
  const contactRef = useFadeIn();

  return (
    <div style={cssVars as CSSProperties}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Oswald:wght@300;400;500;600;700&family=IM+Fell+English:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; scroll-padding-top: 72px; }
        body { overflow-x: hidden; }

        :root {
          --beast-black:  #111111;
          --beast-dark:   #1a1a1a;
          --beast-card:   #222222;
          --beast-gold:   #d4af37;
          --beast-gold2:  #b8962e;
          --beast-cream:  #f5f0e8;
          --beast-cream2: #ede8de;
          --beast-muted:  #8a8070;
          --beast-serif:  'Playfair Display', Georgia, serif;
          --beast-slab:   'Oswald', 'Arial Narrow', sans-serif;
          --beast-fell:   'IM Fell English', Georgia, serif;
        }

        a { color: inherit; text-decoration: none; }
        .tb-container { max-width: 1140px; margin: 0 auto; padding: 0 1.75rem; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--beast-black); }
        ::-webkit-scrollbar-thumb { background: var(--beast-gold2); }

        /* ── FADE IN ── */
        .tb-fade { opacity: 0; transform: translateY(28px); transition: opacity .9s ease, transform .9s ease; }
        .tb-fade.tb-vis { opacity: 1; transform: none; }

        /* ── NAV ── */
        .tb-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 1.2rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: all .35s ease;
        }
        .tb-nav.scrolled {
          background: rgba(17,17,17,.97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(212,175,55,.2);
          padding: .85rem 2rem;
        }
        .tb-nav-logo {
          font-family: var(--beast-slab);
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--beast-gold);
        }
        .tb-nav-links {
          display: flex; gap: 2.5rem; list-style: none;
          font-family: var(--beast-slab);
          font-size: .72rem;
          font-weight: 400;
          letter-spacing: .25em;
          text-transform: uppercase;
          color: rgba(245,240,232,.5);
        }
        .tb-nav-links a { transition: color .25s; }
        .tb-nav-links a:hover { color: var(--beast-gold); }
        .tb-nav-cta {
          font-family: var(--beast-slab);
          font-size: .72rem;
          font-weight: 600;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--beast-black);
          background: var(--beast-gold);
          padding: .6rem 1.6rem;
          border: none;
          cursor: pointer;
          transition: background .25s, transform .2s;
          display: inline-block;
        }
        .tb-nav-cta:hover { background: var(--beast-gold2); transform: translateY(-1px); }
        .tb-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .tb-hamburger span {
          display: block; width: 24px; height: 2px;
          background: var(--beast-gold); border-radius: 1px;
        }

        /* ── MOBILE MENU ── */
        .tb-mobile-menu {
          display: none; position: fixed; inset: 0; z-index: 300;
          background: var(--beast-black);
          flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem;
          border-top: 3px solid var(--beast-gold);
        }
        .tb-mobile-menu.open { display: flex; }
        .tb-mobile-menu a {
          font-family: var(--beast-serif);
          font-size: 2.2rem;
          font-style: italic;
          color: var(--beast-cream);
          transition: color .2s;
        }
        .tb-mobile-menu a:hover { color: var(--beast-gold); }
        .tb-mobile-close {
          position: absolute; top: 1.5rem; right: 1.8rem;
          background: none; border: none;
          font-family: var(--beast-slab);
          font-size: 1.1rem;
          letter-spacing: .15em;
          color: var(--beast-muted);
          cursor: pointer;
          text-transform: uppercase;
        }

        /* ── HERO ── */
        .tb-hero {
          min-height: 100svh;
          background: var(--beast-black);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          padding: 8rem 1.75rem 5rem;
          text-align: center;
        }
        .tb-hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(212,175,55,.03) 60px),
            repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(212,175,55,.03) 60px);
          pointer-events: none;
        }
        /* Decorative corner ornaments */
        .tb-hero::after {
          content: '';
          position: absolute; inset: 1.5rem;
          border: 1px solid rgba(212,175,55,.12);
          pointer-events: none;
        }
        .tb-hero-badge {
          font-family: var(--beast-slab);
          font-size: .6rem;
          font-weight: 400;
          letter-spacing: .55em;
          text-transform: uppercase;
          color: var(--beast-gold);
          margin-bottom: 2rem;
          position: relative;
          display: flex; align-items: center; gap: 1.5rem;
        }
        .tb-hero-badge::before, .tb-hero-badge::after {
          content: ''; flex: 1; max-width: 100px;
          height: 1px; background: var(--beast-gold); opacity: .4;
        }
        .tb-hero-title {
          font-family: var(--beast-serif);
          font-size: clamp(4rem, 14vw, 13rem);
          font-weight: 900;
          line-height: .88;
          color: var(--beast-cream);
          letter-spacing: -.02em;
          text-transform: uppercase;
          position: relative;
          margin-bottom: .5rem;
        }
        .tb-hero-title em {
          font-style: italic;
          color: var(--beast-gold);
          display: block;
        }
        .tb-hero-title .tb-amp {
          color: var(--beast-gold);
          font-style: italic;
        }
        .tb-hero-divider {
          display: flex; align-items: center; gap: 1.5rem;
          justify-content: center;
          margin: 1.2rem 0;
          color: var(--beast-gold);
          font-size: .7rem;
          opacity: .6;
        }
        .tb-hero-divider::before, .tb-hero-divider::after {
          content: ''; flex: 0 0 80px; height: 1px; background: var(--beast-gold);
        }
        .tb-hero-subtitle {
          font-family: var(--beast-fell);
          font-size: clamp(1rem, 2.5vw, 1.5rem);
          font-style: italic;
          color: rgba(245,240,232,.5);
          margin-bottom: 3rem;
          letter-spacing: .05em;
        }
        .tb-hero-cta {
          font-family: var(--beast-slab);
          font-size: .78rem;
          font-weight: 600;
          letter-spacing: .35em;
          text-transform: uppercase;
          color: var(--beast-black);
          background: var(--beast-gold);
          padding: 1.1rem 3.2rem;
          border: none; cursor: pointer;
          transition: background .25s, transform .2s, box-shadow .2s;
          display: inline-block;
          box-shadow: 0 0 0 1px var(--beast-gold2), 5px 5px 0 var(--beast-gold2);
        }
        .tb-hero-cta:hover {
          background: var(--beast-gold2);
          transform: translate(-2px, -2px);
          box-shadow: 0 0 0 1px var(--beast-gold2), 7px 7px 0 var(--beast-gold2);
        }
        .tb-hero-scroll {
          position: absolute; bottom: 3rem; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: .5rem;
          font-family: var(--beast-slab);
          font-size: .55rem; letter-spacing: .35em;
          text-transform: uppercase;
          color: rgba(212,175,55,.35);
          animation: tbScrollBounce 2.5s ease-in-out infinite;
        }
        @keyframes tbScrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: .35; }
          50% { transform: translateX(-50%) translateY(6px); opacity: .65; }
        }
        .tb-hero-ornament {
          position: absolute;
          font-family: var(--beast-serif);
          font-size: 20vw;
          font-weight: 900;
          font-style: italic;
          color: rgba(212,175,55,.025);
          pointer-events: none;
          user-select: none;
          letter-spacing: -.05em;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          white-space: nowrap;
        }

        /* ── SECTION LABEL ── */
        .tb-label {
          font-family: var(--beast-slab);
          font-size: .6rem;
          font-weight: 400;
          letter-spacing: .5em;
          text-transform: uppercase;
          color: var(--beast-gold);
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 1.2rem;
        }
        .tb-label::after {
          content: ''; flex: 1; max-width: 60px;
          height: 1px; background: var(--beast-gold); opacity: .4;
        }

        /* ── ABOUT (LIGHT) ── */
        .tb-about {
          background: var(--beast-cream);
          padding: 6rem 0 4rem;
        }
        .tb-about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
        }
        .tb-photo-wrap {
          position: relative;
          aspect-ratio: 3/4;
          transform: rotate(-1.5deg);
        }
        .tb-photo-wrap::before {
          content: '';
          position: absolute; inset: -8px;
          border: 2px solid var(--beast-gold);
          transform: rotate(2deg);
          z-index: 0;
          opacity: .6;
        }
        .tb-photo-inner {
          position: relative; z-index: 1;
          width: 100%; height: 100%;
          overflow: hidden;
          filter: sepia(.3) contrast(1.1) brightness(.95);
        }
        .tb-photo-inner img { width: 100%; height: 100%; object-fit: cover; }
        .tb-photo-placeholder {
          width: 100%; height: 100%;
          background: var(--beast-cream2);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--beast-serif);
          font-size: 5rem;
          color: var(--beast-muted);
        }
        .tb-about-heading {
          font-family: var(--beast-serif);
          font-size: clamp(2.2rem, 4vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          color: var(--beast-black);
          margin-bottom: 1.8rem;
        }
        .tb-about-heading em {
          font-style: italic;
          color: var(--beast-gold2);
        }
        .tb-about-text {
          font-family: var(--beast-fell);
          font-size: 1rem;
          font-style: italic;
          color: #4a4030;
          line-height: 2;
          margin-bottom: 1.2rem;
        }
        .tb-about-rule {
          width: 60px; height: 2px;
          background: var(--beast-gold);
          margin: 1.5rem 0;
        }
        .tb-about-barber {
          display: flex; align-items: center; gap: 1rem;
          margin-top: 1.8rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(0,0,0,.1);
        }
        .tb-about-barber-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
          border: 2px solid var(--beast-gold);
          filter: sepia(.2) contrast(1.05);
        }
        .tb-about-barber-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .tb-about-barber-name {
          font-family: var(--beast-serif);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--beast-black);
        }
        .tb-about-barber-role {
          font-family: var(--beast-slab);
          font-size: .58rem;
          letter-spacing: .35em;
          text-transform: uppercase;
          color: var(--beast-gold2);
          margin-top: .2rem;
        }

        /* ── SERVICES (DARK — MENU STYLE) ── */
        .tb-services {
          background: var(--beast-dark);
          padding: 6rem 0;
        }
        .tb-section-heading {
          font-family: var(--beast-serif);
          font-size: clamp(2.8rem, 5vw, 4.5rem);
          font-weight: 900;
          color: var(--beast-cream);
          line-height: 1;
          margin-bottom: 1rem;
        }
        .tb-section-heading em {
          font-style: italic;
          color: var(--beast-gold);
        }
        .tb-services-hdr { text-align: center; margin-bottom: 4rem; }
        .tb-services-divider {
          display: flex; align-items: center; gap: 1rem;
          justify-content: center;
          margin: 1rem 0;
          color: var(--beast-gold);
          opacity: .5;
        }
        .tb-services-divider::before, .tb-services-divider::after {
          content: ''; flex: 0 0 60px; height: 1px; background: var(--beast-gold);
        }
        .tb-menu-list {
          max-width: 780px; margin: 0 auto;
          display: flex; flex-direction: column;
          border-top: 1px solid rgba(212,175,55,.15);
        }
        .tb-menu-item {
          display: flex; align-items: baseline;
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(212,175,55,.1);
          gap: .5rem;
        }
        .tb-menu-name {
          font-family: var(--beast-serif);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--beast-cream);
          flex-shrink: 0;
        }
        .tb-menu-dots {
          flex: 1;
          border-bottom: 2px dotted rgba(212,175,55,.25);
          margin: 0 .8rem;
          margin-bottom: .25rem;
          min-width: 40px;
        }
        .tb-menu-price {
          font-family: var(--beast-slab);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--beast-gold);
          flex-shrink: 0;
          letter-spacing: .05em;
        }
        .tb-menu-meta {
          width: 100%;
          font-family: var(--beast-slab);
          font-size: .62rem;
          font-weight: 400;
          letter-spacing: .25em;
          text-transform: uppercase;
          color: rgba(212,175,55,.5);
          margin-top: .3rem;
          padding-left: 0;
        }

        /* ── GALLERY (MASONRY) ── */
        .tb-gallery {
          background: var(--beast-black);
          padding: 6rem 0;
        }
        .tb-gallery-hdr { text-align: center; margin-bottom: 3rem; }
        .tb-masonry {
          columns: 3;
          column-gap: 3px;
        }
        .tb-masonry-item {
          break-inside: avoid;
          margin-bottom: 3px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 1px solid rgba(212,175,55,.15);
          display: block;
        }
        .tb-masonry-item img {
          width: 100%; height: auto;
          display: block;
          filter: sepia(.15) contrast(1.05);
          transition: filter .4s, transform .5s;
        }
        .tb-masonry-item:hover img {
          filter: sepia(.3) contrast(1.1);
          transform: scale(1.03);
        }
        .tb-masonry-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(17,17,17,.7) 0%, transparent 50%);
          opacity: 0;
          transition: opacity .4s;
          display: flex; align-items: flex-end;
          padding: .8rem;
        }
        .tb-masonry-item:hover .tb-masonry-overlay { opacity: 1; }
        .tb-masonry-nr {
          font-family: var(--beast-slab);
          font-size: .58rem;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: var(--beast-gold);
        }

        /* ── BOOKING ── */
        .tb-booking {
          background: var(--beast-black);
          padding: 6rem 0;
        }
        .tb-booking-frame {
          background: var(--beast-cream);
          border-radius: 16px;
          border: 1px solid rgba(212,175,55,.3);
          box-shadow: inset 0 0 0 1px rgba(212,175,55,.08), 0 0 60px rgba(212,175,55,.05);
          padding: 3rem;
          position: relative;
        }
        .tb-booking-frame::before,
        .tb-booking-frame::after {
          content: '✦';
          position: absolute;
          font-size: 1.2rem;
          color: var(--beast-gold);
          opacity: .6;
        }
        .tb-booking-frame::before { top: -0.6rem; left: 1.5rem; }
        .tb-booking-frame::after { bottom: -0.6rem; right: 1.5rem; }
        .tb-booking-hdr { text-align: center; margin-bottom: 2.5rem; }

        /* ── WORKING HOURS (dark override) ── */
        .tb-hours-wrap {
          background: var(--beast-dark);
          padding: 5rem 0;
        }
        .tb-hours-inner {
          max-width: 600px; margin: 0 auto; text-align: center;
        }

        /* ── CONTACT ── */
        .tb-contact {
          background: var(--beast-black);
          padding: 5rem 0;
          border-top: 1px solid rgba(212,175,55,.1);
        }
        .tb-contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem; align-items: start;
        }
        .tb-contact-label {
          font-family: var(--beast-slab);
          font-size: .58rem;
          letter-spacing: .35em;
          text-transform: uppercase;
          color: var(--beast-gold);
          margin-bottom: .35rem;
        }
        .tb-contact-val {
          font-family: var(--beast-fell);
          font-size: .98rem;
          font-style: italic;
          color: rgba(245,240,232,.65);
          line-height: 1.7;
        }
        .tb-contact-val a:hover { color: var(--beast-gold); }
        .tb-contact-row {
          padding: 1.2rem 0;
          border-bottom: 1px solid rgba(212,175,55,.1);
          display: flex; gap: 1.2rem; align-items: flex-start;
        }
        .tb-contact-icon { color: var(--beast-gold); flex-shrink: 0; margin-top: 3px; }
        .tb-map-wrap {
          aspect-ratio: 4/3;
          border: 1px solid rgba(212,175,55,.25);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: var(--beast-dark);
          color: rgba(212,175,55,.3);
          font-family: var(--beast-slab);
          font-size: .62rem;
          letter-spacing: .25em;
          text-transform: uppercase;
        }
        .tb-map-wrap iframe { width: 100%; height: 100%; border: none; }

        /* ── SOCIAL BAR ── */
        .tb-social {
          background: var(--beast-dark);
          border-top: 1px solid rgba(212,175,55,.1);
          padding: 1.5rem 0;
        }
        .tb-social-inner {
          display: flex; align-items: center; justify-content: center;
          gap: 2.5rem; flex-wrap: wrap;
        }
        .tb-social-link {
          font-family: var(--beast-slab);
          font-size: .62rem;
          font-weight: 400;
          letter-spacing: .25em;
          text-transform: uppercase;
          color: rgba(245,240,232,.35);
          display: flex; align-items: center; gap: .6rem;
          transition: color .2s;
        }
        .tb-social-link:hover { color: var(--beast-gold); }

        /* ── FOOTER ── */
        .tb-footer {
          background: #0a0a0a;
          border-top: 1px solid rgba(212,175,55,.15);
          padding: 3.5rem 0 2rem;
          text-align: center;
        }
        .tb-footer-logo {
          font-family: var(--beast-serif);
          font-size: 2.2rem;
          font-weight: 900;
          font-style: italic;
          color: var(--beast-gold);
          letter-spacing: .02em;
          margin-bottom: .4rem;
        }
        .tb-footer-tagline {
          font-family: var(--beast-slab);
          font-size: .6rem;
          letter-spacing: .45em;
          text-transform: uppercase;
          color: rgba(245,240,232,.2);
          margin-bottom: 2rem;
        }
        .tb-footer-nav {
          display: flex; justify-content: center; flex-wrap: wrap;
          gap: 2rem; margin-bottom: 2rem;
          list-style: none;
          font-family: var(--beast-slab);
          font-size: .65rem;
          letter-spacing: .25em;
          text-transform: uppercase;
          color: rgba(245,240,232,.25);
        }
        .tb-footer-nav a { transition: color .2s; }
        .tb-footer-nav a:hover { color: var(--beast-gold); }
        .tb-footer-copy {
          font-family: var(--beast-slab);
          font-size: .58rem;
          letter-spacing: .2em;
          color: rgba(245,240,232,.12);
          border-top: 1px solid rgba(255,255,255,.05);
          padding-top: 1.5rem;
          margin-top: 0;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .tb-about-grid { grid-template-columns: 1fr; gap: 3rem; }
          .tb-contact-grid { grid-template-columns: 1fr; }
          .tb-masonry { columns: 2; }
        }
        @media (max-width: 768px) {
          .tb-nav-links, .tb-nav-cta { display: none; }
          .tb-hamburger { display: flex; }
          .tb-masonry { columns: 2; }
          .tb-booking-frame { padding: 1.5rem; }
        }
        @media (max-width: 480px) {
          .tb-masonry { columns: 1; }
          .tb-menu-item { flex-wrap: wrap; }
          .tb-menu-dots { display: none; }
        }
      `}</style>

      {/* ── MOBILE MENU ── */}
      <div className={`tb-mobile-menu${menuOpen ? " open" : ""}`}>
        <button className="tb-mobile-close" onClick={() => setMenuOpen(false)}>✕ затвори</button>
        {hasAbout && <a href="#about" onClick={() => setMenuOpen(false)}>За нас</a>}
        <a href="#services" onClick={() => setMenuOpen(false)}>Услуги</a>
        {hasGallery && <a href="#gallery" onClick={() => setMenuOpen(false)}>Галерия</a>}
        <a href="#booking" onClick={() => setMenuOpen(false)}>Запази час</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>Контакти</a>
      </div>

      {/* ── NAV ── */}
      <nav className={`tb-nav${scrolled ? " scrolled" : ""}`}>
        <a href="#hero" className="tb-nav-logo">{tenant.salon_name}</a>
        <ul className="tb-nav-links">
          {hasAbout && <li><a href="#about">За нас</a></li>}
          <li><a href="#services">Услуги</a></li>
          {hasGallery && <li><a href="#gallery">Галерия</a></li>}
          <li><a href="#contact">Контакти</a></li>
        </ul>
        <a href="#booking" className="tb-nav-cta">Запази час</a>
        <button className="tb-hamburger" onClick={() => setMenuOpen(true)} aria-label="Отвори меню">
          <span /><span /><span />
        </button>
      </nav>

      {/* ── HERO ── */}
      <section
        className="tb-hero"
        id="hero"
        style={tenant.hero_image_url ? {
          backgroundImage: `url(${tenant.hero_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        } : undefined}
      >
        {tenant.hero_image_url && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(17,17,17,0.72) 0%, rgba(17,17,17,0.55) 50%, rgba(17,17,17,0.85) 100%)",
            pointerEvents: "none",
          }} aria-hidden="true" />
        )}
        <span className="tb-hero-ornament" aria-hidden="true">{tenant.salon_name}</span>
        <div ref={heroRef} className="tb-fade">
          <p className="tb-hero-badge">{tenant.salon_name}</p>
          <h1 className="tb-hero-title">
            {tenant.hero_title ? (
              tenant.hero_title
            ) : (
              <>
                Прически<br /><em>&amp; Брада</em>
              </>
            )}
          </h1>
          <div className="tb-hero-divider" aria-hidden="true">✦</div>
          <p className="tb-hero-subtitle">
            {tenant.hero_subtitle ?? "Класически стил. Без компромиси."}
          </p>
          <a href="#booking" className="tb-hero-cta">Запази час</a>
        </div>
        <div className="tb-hero-scroll" aria-hidden="true">
          <span>Скрол</span>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect x="1" y="1" width="12" height="18" rx="6" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
            <rect x="6" y="4" width="2" height="5" rx="1" fill="currentColor"/>
          </svg>
        </div>
      </section>

      <TornDividerDarkToLight />

      {/* ── ABOUT ── */}
      {hasAbout && (
        <section className="tb-about" id="about">
          <div className="tb-container">
            <div ref={aboutRef} className="tb-about-grid tb-fade">
              <div className="tb-photo-wrap">
                <div className="tb-photo-inner">
                  {tenant.about_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tenant.about_image_url}
                      alt={tenant.salon_name}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="tb-photo-placeholder">✂</div>
                  )}
                </div>
              </div>
              <div>
                <p className="tb-label">Нашата история</p>
                <h2 className="tb-about-heading">
                  Истинско <em>майсторство</em>,<br />за истински <em>мъже</em>.
                </h2>
                <div className="tb-about-rule" />
                {aboutText && (
                  <p className="tb-about-text">{aboutText}</p>
                )}
                {aboutText2 && (
                  <p className="tb-about-text">{aboutText2}</p>
                )}
                {soloBarber && (
                  <div className="tb-about-barber">
                    {soloBarber.avatar_url && (
                      <div className="tb-about-barber-avatar">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={soloBarber.avatar_url} alt={soloBarber.name} loading="lazy" />
                      </div>
                    )}
                    <div>
                      <p className="tb-about-barber-name">{soloBarber.name}</p>
                      {soloBarber.role && (
                        <p className="tb-about-barber-role">{soloBarber.role}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <TornDividerLightToDark />

      {/* ── SERVICES ── */}
      <section className="tb-services" id="services">
        <div className="tb-container">
          <div ref={servicesRef} className="tb-fade">
            <div className="tb-services-hdr">
              <p className="tb-label" style={{ justifyContent: "center" }}>Менюто</p>
              <h2 className="tb-section-heading">
                Нашите <em>Услуги</em>
              </h2>
              <div className="tb-services-divider">✦</div>
            </div>
            <div className="tb-menu-list">
              {data.services.map((service) => (
                <div key={service.id} className="tb-menu-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline" }}>
                      <span className="tb-menu-name">{service.name}</span>
                      <span className="tb-menu-dots" aria-hidden="true" />
                      <span className="tb-menu-price">
                        {service.price_eur.toFixed(0)} € <span className="tb-menu-price-bgn">(≈{(Number(service.price_eur) * 1.956).toFixed(2)} лв)</span>
                      </span>
                    </div>
                    {service.duration_minutes && (
                      <div className="tb-menu-meta">
                        {fmtDuration(service.duration_minutes)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <a href="#booking" className="tb-nav-cta" style={{ display: "inline-block" }}>
                Запази час
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      {hasGallery && (
        <section className="tb-gallery" id="gallery">
          <div className="tb-container">
            <div ref={galleryRef} className="tb-fade">
              <div className="tb-gallery-hdr">
                <p className="tb-label" style={{ justifyContent: "center" }}>Нашата работа</p>
                <h2 className="tb-section-heading">
                  Прецизни <em>прически</em>
                </h2>
              </div>
              <div className="tb-masonry">
                {gallery.map((img, i) => (
                  <div className="tb-masonry-item" key={img.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Gallery ${i + 1}`}
                      loading="lazy"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                    <div className="tb-masonry-overlay">
                      <span className="tb-masonry-nr">#{String(i + 1).padStart(2, "0")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── BOOKING ── */}
      <section className="tb-booking" id="booking">
        <div className="tb-container">
          <div ref={bookingRef} className="tb-fade">
            <div className="tb-booking-hdr">
              <p className="tb-label" style={{ justifyContent: "center" }}>Резервация</p>
              <h2 className="tb-section-heading">
                Запази <em>час</em>
              </h2>
            </div>
            <div className="tb-booking-frame">
              <BookingFlow salonData={data} />
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKING HOURS ── */}
      {data.workingHours.length > 0 && (
        <div className="tb-hours-wrap">
          <div className="tb-container">
            <div ref={contactRef} className="tb-hours-inner tb-fade">
              <p className="tb-label" style={{ justifyContent: "center" }}>Работно време</p>
              <h2 className="tb-section-heading" style={{ marginBottom: "2rem" }}>
                Отворени <em>сме</em>
              </h2>
              <SalonWorkingHours
                data={data}
                headingClassName=""
                rowClassName=""
                rowBorderClassName=""
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACT ── */}
      <section className="tb-contact" id="contact">
        <div className="tb-container">
          <div className="tb-contact-grid">
            <div>
              <p className="tb-label">Намерете ни</p>
              <h2 className="tb-section-heading" style={{ marginBottom: "2rem", fontSize: "clamp(2rem,3.5vw,3rem)" }}>
                <em>Контакти</em>
              </h2>
              {tenant.address && (
                <div className="tb-contact-row">
                  <svg className="tb-contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <p className="tb-contact-label">Адрес</p>
                    <p className="tb-contact-val">{tenant.address}</p>
                  </div>
                </div>
              )}
              {tenant.phone && (
                <div className="tb-contact-row">
                  <svg className="tb-contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <div>
                    <p className="tb-contact-label">Телефон</p>
                    <p className="tb-contact-val"><a href={`tel:${tenant.phone}`}>{tenant.phone}</a></p>
                  </div>
                </div>
              )}
              {tenant.email && (
                <div className="tb-contact-row">
                  <svg className="tb-contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <div>
                    <p className="tb-contact-label">Имейл</p>
                    <p className="tb-contact-val"><a href={`mailto:${tenant.email}`}>{tenant.email}</a></p>
                  </div>
                </div>
              )}
            </div>
            <div className="tb-map-wrap">
              {mapsSrc
                ? <iframe src={mapsSrc} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Карта" />
                : <span>Картата не е зададена</span>
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL ── */}
      {(igHref || fbHref || tkHref) && (
        <div className="tb-social">
          <div className="tb-social-inner">
            {igHref && (
              <a href={igHref} target="_blank" rel="noopener noreferrer" className="tb-social-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                Instagram
              </a>
            )}
            {fbHref && (
              <a href={fbHref} target="_blank" rel="noopener noreferrer" className="tb-social-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                Facebook
              </a>
            )}
            {tkHref && (
              <a href={tkHref} target="_blank" rel="noopener noreferrer" className="tb-social-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="tb-footer">
        <div className="tb-container">
          <p className="tb-footer-logo">{tenant.salon_name}</p>
          <p className="tb-footer-tagline">Премиум Барбершоп · Истинско майсторство</p>
          <ul className="tb-footer-nav">
            {hasAbout && <li><a href="#about">За нас</a></li>}
            <li><a href="#services">Услуги</a></li>
            {hasGallery && <li><a href="#gallery">Галерия</a></li>}
            <li><a href="#booking">Резервация</a></li>
            <li><a href="#contact">Контакти</a></li>
            <li><Link href={tenantPublicPath(tenant.salon_slug, "booking")}>Онлайн резервация</Link></li>
          </ul>
          <p className="tb-footer-copy">
            © {new Date().getFullYear()} {tenant.salon_name} · Всички права запазени
          </p>
        </div>
      </footer>
    </div>
  );
}
