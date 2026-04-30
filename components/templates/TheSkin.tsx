"use client";

import { useEffect, useRef, useState } from "react";
import type { SalonData, Service } from "@/types/database";
import { servicesFlatForPublic } from "@/components/templates/salon-shared";
import {
  safeFacebookHref,
  safeGoogleMapsEmbedSrc,
  safeInstagramHref,
  safeTenantPublicImageUrl,
} from "@/lib/safe-public-urls";

const DAY_BG = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;
const BGN = 1.956;

/** Prefer адрес за геокод — името на салона често води до грешен обект в Google (особено на мобилни). */
function mapsGeoTargetForTenant(address: string | null | undefined, salonName: string | null | undefined): string {
  const addr = typeof address === "string" ? address.trim() : "";
  if (addr !== "") {
    const lower = addr.toLowerCase();
    if (lower.includes("българия") || lower.includes("bulgaria")) return addr;
    return `${addr}, Bulgaria`;
  }
  return typeof salonName === "string" ? salonName.trim() : "";
}

/**
 * Точни lat/lng (напр. от Google Maps → сподели). В `design_tokens`: `"maps_pin": { "lat": 42.49, "lng": 27.46 }`.
 * За салона theskin има канон координати от официалния /maps/place/ линк, ако няма override в tokens.
 */
const THESKIN_DEFAULT_MAP_PIN: { lat: number; lng: number } = { lat: 42.4924703, lng: 27.4625005 };

function readValidatedMapsPin(tokens: Record<string, unknown>): { lat: number; lng: number } | null {
  const raw = tokens.maps_pin;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const lat = typeof o.lat === "number" ? o.lat : Number(o.lat);
  const lng = typeof o.lng === "number" ? o.lng : Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 41.2 || lat > 44.35 || lng < 22.25 || lng > 28.85) return null;
  return { lat, lng };
}

function eur(v: number) { return `${Number(v).toFixed(0)} €`; }
function bgn(v: number) { return `${(Number(v) * BGN).toFixed(0)} лв`; }

function useVisible() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.dataset.v = "1"; io.unobserve(el); } }, { threshold: 0.1 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return ref;
}

interface Testimonial { quote: string; name: string; }
interface Product { name: string; subtitle: string; description: string; imageUrl: string | null; }

function theSkinProductsFromTokens(tokens: Record<string, unknown>): Product[] {
  const arr = Array.isArray(tokens.products) ? tokens.products : [];
  const out: Product[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const subtitle = typeof o.subtitle === "string" ? o.subtitle.trim() : "";
    const description = typeof o.description === "string" ? o.description.trim() : "";
    if (!name && !description) continue;
    const imgRaw =
      typeof o.image_url === "string" ? o.image_url : typeof o.image === "string" ? o.image : "";
    const imageUrl = safeTenantPublicImageUrl(imgRaw);
    out.push({ name, subtitle, description, imageUrl });
  }
  return out;
}

function ServiceRow({ s, idx }: { s: Service; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ts-svc-row" data-open={open ? "1" : undefined}>
      <button className="ts-svc-btn" onClick={() => setOpen(p => !p)} type="button">
        <span className="ts-svc-idx">{String(idx + 1).padStart(2, "0")}</span>
        <span className="ts-svc-name">{s.name}</span>
        <span className="ts-svc-dur">{s.duration_minutes ? `${s.duration_minutes} мин` : "по договаряне"}</span>
        <span className="ts-svc-toggle">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="ts-svc-body">
          <div className="ts-svc-price-row"><span>Цена</span><strong>{eur(Number(s.price_eur))}</strong></div>
          <div className="ts-svc-price-row"><span>Приблизително</span><strong>{bgn(Number(s.price_eur))}</strong></div>
        </div>
      )}
    </div>
  );
}

function Carousel({ items }: { items: Testimonial[] }) {
  const [cur, setCur] = useState(0);
  const len = items.length;
  useEffect(() => {
    const t = setInterval(() => setCur(p => (p + 1) % len), 5000);
    return () => clearInterval(t);
  }, [len]);
  return (
    <div className="ts-car">
      <div className="ts-car-q">&#8220;</div>
      <p className="ts-car-text" key={cur}>{items[cur].quote}</p>
      <p className="ts-car-name">— {items[cur].name}</p>
      <div className="ts-car-dots">
        {items.map((_, i) => (
          <button key={i} className={`ts-car-dot${i === cur ? " on" : ""}`} onClick={() => setCur(i)} aria-label={`${i + 1}`} type="button" />
        ))}
      </div>
    </div>
  );
}

export function TheSkin({ data }: { data: SalonData }) {
  const { tenant, gallery, workingHours } = data;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const services = servicesFlatForPublic(data);
  const tokens = (tenant.design_tokens ?? {}) as Record<string, unknown>;
  const testimonials = Array.isArray(tokens.testimonials) ? tokens.testimonials as Testimonial[] : [];
  const products = theSkinProductsFromTokens(tokens);
  const productsLink = typeof tokens.products_link === "string" ? tokens.products_link : null;

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  /** Official share embed wins; stale maps.google `/maps?q=…` in DB hides our better pin fallback. */
  const tenantMapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);
  const officialPbEmbed =
    tenantMapsSrc?.startsWith("https://www.google.com/maps/embed?") ? tenantMapsSrc : null;
  const mapsGeoTarget = mapsGeoTargetForTenant(tenant.address, tenant.salon_name);
  const mapsPinFromTokens = readValidatedMapsPin(tokens);
  const mapsPin =
    mapsPinFromTokens ?? (tenant.salon_slug === "theskin" ? THESKIN_DEFAULT_MAP_PIN : null);

  const mapsDirectionsHref =
    mapsPin !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${mapsPin.lat},${mapsPin.lng}`
      : mapsGeoTarget !== ""
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsGeoTarget)}`
        : null;

  const embedFromCoords =
    mapsPin !== null
      ? `https://maps.google.com/maps?q=${mapsPin.lat},${mapsPin.lng}&hl=bg&t=m&z=18&output=embed`
      : null;
  const embedFromAddress =
    !officialPbEmbed && mapsGeoTarget !== ""
      ? `https://maps.google.com/maps?hl=bg&q=${encodeURIComponent(mapsGeoTarget)}&t=m&z=17&ie=UTF8&iwloc=B&output=embed`
      : null;

  const effectiveMapsSrc = officialPbEmbed ?? embedFromCoords ?? embedFromAddress ?? tenantMapsSrc;
  const phone = tenant.phone ?? "";
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, "")}` : null;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => { document.body.style.overflow = menuOpen ? "hidden" : ""; }, [menuOpen]);

  function go(id: string) {
    setMenuOpen(false);
    document.body.style.overflow = "";
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const r1 = useVisible(); const r2 = useVisible(); const r3 = useVisible();
  const r4 = useVisible(); const r5 = useVisible(); const r6 = useVisible();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; font-size: 16px; }
        body { background: #FAF8F4; color: #1A1A1A; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 300; line-height: 1.7; overflow-x: hidden; }
        a { color: inherit; text-decoration: none; }
        img { display: block; max-width: 100%; }
        button { cursor: pointer; font-family: inherit; }

        /* TOKENS */
        :root {
          --gold: #C9A06A;
          --gold-lt: #E2C89E;
          --gold-dk: #9B7340;
          --dark: #1A1A1A;
          --mid: #555;
          --muted: #999;
          --cream: #FAF8F4;
          --white: #FFFFFF;
          --border: rgba(201,160,106,0.2);
          --serif: 'Playfair Display', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
          --ease: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* SCROLL REVEAL */
        [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity 0.8s var(--ease), transform 0.8s var(--ease); }
        [data-reveal][data-v="1"] { opacity: 1; transform: none; }
        [data-reveal][data-delay="1"] { transition-delay: 0.1s; }
        [data-reveal][data-delay="2"] { transition-delay: 0.2s; }
        [data-reveal][data-delay="3"] { transition-delay: 0.3s; }

        /* LAYOUT */
        .ts-wrap { max-width: 1120px; margin: 0 auto; padding: 0 2rem; }

        /* GOLD LINE */
        .ts-rule { width: 48px; height: 1px; background: var(--gold); margin: 1.1rem 0; }
        .ts-rule-c { margin: 1.1rem auto; }

        /* ── NAV ────────────────────────────────────────────── */
        .ts-nav {
          position: fixed; inset: 0 0 auto; z-index: 200;
          padding: 1.4rem 2.5rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.4s, box-shadow 0.4s, padding 0.4s;
        }
        .ts-nav.sc {
          background: rgba(250,248,244,0.97);
          backdrop-filter: blur(12px);
          box-shadow: 0 1px 0 var(--border);
          padding: 1rem 2.5rem;
        }
        .ts-logo { height: 40px; width: auto; object-fit: contain; cursor: pointer; display: block; }
        .ts-logo-text { font-family: var(--serif); font-size: 1.3rem; color: var(--dark); cursor: pointer; }
        .ts-nav-links { display: flex; align-items: center; gap: 2.5rem; list-style: none; }
        .ts-nav-links button { background: none; border: none; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--mid); transition: color 0.2s; padding: 0; }
        .ts-nav-links button:hover { color: var(--gold); }
        .ts-nav-cta {
          background: var(--gold); color: var(--white); border: none;
          font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase;
          font-weight: 500; padding: 0.7rem 1.6rem;
          transition: background 0.2s, transform 0.2s;
          text-decoration: none; display: inline-block;
        }
        .ts-nav-cta:hover { background: var(--gold-dk); transform: translateY(-1px); }
        .ts-burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; padding: 4px; }
        .ts-burger span { display: block; width: 22px; height: 1.5px; background: var(--dark); transition: all 0.3s; }

        /* ── MOBILE MENU ─────────────────────────────────────── */
        .ts-mob { position: fixed; inset: 0; z-index: 190; background: var(--cream); display: none; flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem; }
        .ts-mob.open { display: flex; }
        .ts-mob-close { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; font-size: 1.5rem; color: var(--muted); }
        .ts-mob button, .ts-mob a { font-family: var(--serif); font-size: 2rem; color: var(--dark); background: none; border: none; }

        /* ── HERO ────────────────────────────────────────────── */
        .ts-hero {
          position: relative; min-height: 100svh;
          display: grid; grid-template-columns: 1fr 1fr;
          overflow: hidden;
        }
        .ts-hero-left {
          display: flex; flex-direction: column; justify-content: center;
          padding: 7rem 4rem 4rem 5rem; position: relative; z-index: 2;
          background: var(--cream);
        }
        .ts-hero-eyebrow { font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 1.5rem; }
        .ts-hero-title {
          font-family: var(--serif); font-size: clamp(2.6rem, 4.5vw, 4.5rem);
          font-weight: 400; line-height: 1.1; color: var(--dark);
          margin-bottom: 1.5rem;
        }
        .ts-hero-title em { font-style: italic; color: var(--gold); }
        .ts-hero-sub { font-size: 0.95rem; color: var(--mid); max-width: 360px; margin-bottom: 2.5rem; line-height: 1.8; }
        .ts-hero-actions { display: flex; flex-direction: column; gap: 1rem; align-items: flex-start; }
        .ts-hero-phone {
          display: inline-flex; align-items: center; gap: 0.75rem;
          font-family: var(--serif); font-size: 1.5rem;
          color: var(--dark); text-decoration: none;
          border-bottom: 1px solid var(--gold);
          padding-bottom: 0.3rem;
          transition: color 0.2s;
        }
        .ts-hero-phone:hover { color: var(--gold); }
        .ts-hero-phone svg { color: var(--gold); flex-shrink: 0; }
        .ts-hero-note { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
        .ts-hero-right { position: relative; overflow: hidden; }
        .ts-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .ts-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(250,248,244,0.15) 0%, transparent 60%); }
        .ts-hero-badge {
          position: absolute; bottom: 2.5rem; right: 2.5rem;
          background: var(--dark); color: var(--white);
          font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
          padding: 0.8rem 1.2rem; font-weight: 500;
        }

        /* ── ABOUT ───────────────────────────────────────────── */
        .ts-about { background: var(--white); }
        .ts-about-inner { display: grid; grid-template-columns: 480px 1fr; min-height: 480px; }
        .ts-about-img-wrap { position: relative; overflow: hidden; background: #EDE8E0; }
        .ts-about-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .ts-about-img-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--muted); }
        .ts-about-img-placeholder svg { opacity: 0.3; }
        .ts-about-label {
          position: absolute; bottom: 2rem; left: 2rem;
          background: var(--gold); color: var(--white);
          font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase;
          font-weight: 500; padding: 0.5rem 1rem;
        }
        .ts-about-content { padding: 4rem 4.5rem 4rem 5rem; display: flex; flex-direction: column; justify-content: center; }
        .ts-about-tag { font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); }
        .ts-about-name { font-family: var(--serif); font-size: clamp(2rem, 3vw, 2.8rem); color: var(--dark); line-height: 1.2; margin: 1rem 0 1.5rem; }
        .ts-about-name em { font-style: italic; }
        .ts-about-text { font-size: 0.92rem; color: var(--mid); line-height: 1.9; margin-bottom: 1rem; }

        /* ── SERVICES ────────────────────────────────────────── */
        .ts-services { background: var(--cream); padding: 4.25rem 0 1.75rem; }
        .ts-sec-hdr { text-align: center; margin-bottom: 2.25rem; }
        .ts-products .ts-sec-hdr { margin-bottom: 1.35rem; }
        .ts-sec-tag { font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); display: block; margin-bottom: 1rem; }
        .ts-sec-title { font-family: var(--serif); font-size: clamp(2rem, 3.5vw, 3rem); color: var(--dark); line-height: 1.2; }
        .ts-sec-title em { font-style: italic; color: var(--gold); }
        .ts-svc-list { border-top: 1px solid var(--border); }
        .ts-svc-row { border-bottom: 1px solid var(--border); }
        .ts-svc-btn {
          width: 100%; display: grid; grid-template-columns: 3rem 1fr auto 2rem;
          align-items: center; gap: 1.5rem;
          padding: 1.6rem 0; background: none; border: none; text-align: left;
          transition: background 0.2s;
        }
        .ts-svc-btn:hover .ts-svc-name { color: var(--gold); }
        .ts-svc-idx { font-family: var(--serif); font-style: italic; color: var(--gold-lt); font-size: 1rem; }
        .ts-svc-name { font-family: var(--serif); font-size: 1.1rem; color: var(--dark); transition: color 0.2s; }
        .ts-svc-dur { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
        .ts-svc-toggle { font-size: 1.3rem; color: var(--gold); text-align: center; line-height: 1; }
        .ts-svc-body { padding: 0 0 1.5rem 4.5rem; display: flex; flex-direction: column; gap: 0.3rem; }
        .ts-svc-price-row { display: flex; justify-content: space-between; font-size: 0.88rem; padding: 0.4rem 0; border-bottom: 1px solid var(--border); }
        .ts-svc-price-row:last-child { border-bottom: none; }
        .ts-svc-price-row span { color: var(--muted); }
        .ts-svc-price-row strong { color: var(--dark); font-weight: 500; }
        .ts-svc-cta { text-align: center; margin-top: 1.5rem; }

        /* ── PRODUCTS ────────────────────────────────────────── */
        .ts-products { background: var(--white); padding: 1.75rem 0 2.25rem; }
        .ts-prod-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin: 1.35rem 0 1.5rem; }
        .ts-prod-card {
          background: var(--cream); padding: 2.5rem 2rem;
          display: flex; flex-direction: column; gap: 0.8rem;
          position: relative; transition: background 0.3s;
        }
        .ts-prod-card::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--gold); transform: scaleX(0); transition: transform 0.3s var(--ease); transform-origin: left;
        }
        .ts-prod-card:hover { background: var(--white); }
        .ts-prod-card:hover::after { transform: scaleX(1); }
        .ts-prod-img-wrap {
          width: 100%; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 2px;
          background: rgba(237,232,224,0.7); flex-shrink: 0; margin-bottom: 0.75rem;
        }
        .ts-prod-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ts-prod-num { font-family: var(--serif); font-style: italic; font-size: 3rem; color: var(--border); line-height: 1; }
        .ts-prod-name { font-family: var(--serif); font-size: 1.05rem; color: var(--dark); line-height: 1.3; }
        .ts-prod-sub { font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); }
        .ts-prod-desc { font-size: 0.84rem; color: var(--mid); line-height: 1.8; flex: 1; }
        .ts-prod-cta { text-align: center; }

        /* ── TESTIMONIALS ────────────────────────────────────── */
        .ts-testimonials { background: var(--dark); padding: 1.85rem 0 2rem; position: relative; overflow: hidden; }
        .ts-testimonials::before {
          content: '"'; position: absolute; font-family: var(--serif);
          font-size: min(38vw, 18rem); color: rgba(201,160,106,0.06);
          top: 48%; left: 50%; transform: translate(-50%,-50%);
          pointer-events: none; line-height: 1;
        }
        .ts-testimonials .ts-car-hdr { margin-bottom: 0.65rem; }
        .ts-testimonials .ts-rule.ts-rule-c { margin: 0.3rem auto 0.45rem; }
        .ts-testimonials .ts-car-tag { margin-bottom: 0.35rem; }
        .ts-car { max-width: 600px; margin: 0 auto; padding: 0 1.25rem; text-align: center; position: relative; }
        .ts-car-hdr { text-align: center; margin-bottom: 1.75rem; }
        .ts-car-tag { font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold-lt); opacity: 0.6; display: block; margin-bottom: 0.65rem; }
        .ts-car-title { font-family: var(--serif); font-size: clamp(1.45rem, 2.4vw, 2rem); color: var(--cream); }
        .ts-car-title em { font-style: italic; color: var(--gold-lt); }
        .ts-car-q { font-family: var(--serif); font-size: clamp(1.85rem, 4.5vw, 2.65rem); color: var(--gold); line-height: 0.8; margin-bottom: 0.45rem; opacity: 0.4; }
        .ts-car-text { font-family: var(--serif); font-style: italic; font-size: clamp(0.98rem, 1.75vw, 1.2rem); color: var(--cream); line-height: 1.58; margin-bottom: 0.7rem; }
        .ts-car-name { font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold-lt); opacity: 0.7; margin-bottom: 0.55rem; }
        .ts-car-dots { display: flex; justify-content: center; gap: 0.5rem; }
        .ts-car-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; transition: all 0.3s; padding: 0; }
        .ts-car-dot.on { background: var(--gold); transform: scale(1.4); }

        /* ── GALLERY ─────────────────────────────────────────── */
        .ts-gallery { background: var(--cream); padding: 4.25rem 0; }
        .ts-testimonials + .ts-gallery { padding-top: 2.75rem; }
        .ts-gal-scroll { overflow-x: auto; padding: 0 2rem 1rem; scrollbar-width: none; }
        .ts-gal-scroll::-webkit-scrollbar { display: none; }
        .ts-gal-inner { display: flex; gap: 12px; width: max-content; }
        .ts-gal-item { position: relative; overflow: hidden; flex-shrink: 0; }
        .ts-gal-item:nth-child(odd) { width: 300px; height: 400px; }
        .ts-gal-item:nth-child(even) { width: 260px; height: 340px; margin-top: 3rem; }
        .ts-gal-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--ease); }
        .ts-gal-item:hover img { transform: scale(1.04); }
        .ts-gal-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(26,26,26,0.5), transparent); opacity: 0; transition: opacity 0.3s; }
        .ts-gal-item:hover .ts-gal-overlay { opacity: 1; }

        /* ── CTA BLOCK ───────────────────────────────────────── */
        .ts-cta { background: var(--gold); padding: 4.25rem 0; text-align: center; }
        .ts-cta-tag { font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.6); display: block; margin-bottom: 1rem; }
        .ts-cta-title { font-family: var(--serif); font-size: clamp(2.2rem, 4vw, 3.5rem); color: var(--white); line-height: 1.2; margin-bottom: 0.5rem; }
        .ts-cta-title em { font-style: italic; }
        .ts-cta-sub { font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-bottom: 1.75rem; }
        .ts-cta-phone {
          display: inline-flex; align-items: center; gap: 0.8rem;
          font-family: var(--serif); font-size: clamp(1.8rem, 3vw, 2.5rem);
          color: var(--white); text-decoration: none;
          border: 1px solid rgba(255,255,255,0.4);
          padding: 1rem 3rem; margin-bottom: 1rem;
          transition: all 0.3s;
        }
        .ts-cta-phone:hover { background: var(--white); color: var(--gold); border-color: var(--white); }
        .ts-cta-note { font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.5); }

        /* ── CONTACT ─────────────────────────────────────────── */
        .ts-contact { background: var(--white); padding: 4.25rem 0; }
        .ts-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
        .ts-contact-tag { font-size: 0.62rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; }
        .ts-contact-title { font-family: var(--serif); font-size: clamp(1.8rem, 2.5vw, 2.5rem); color: var(--dark); margin: 0.5rem 0 1.35rem; }
        .ts-contact-title em { font-style: italic; }
        .ts-info-row { display: flex; align-items: flex-start; gap: 1rem; padding: 1.2rem 0; border-bottom: 1px solid var(--border); }
        .ts-info-row:first-child { border-top: 1px solid var(--border); }
        .ts-info-icon { color: var(--gold); flex-shrink: 0; margin-top: 2px; }
        .ts-info-lbl { font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.25rem; }
        .ts-info-val { font-size: 0.9rem; color: var(--dark); line-height: 1.6; }
        .ts-info-val a:hover { color: var(--gold); }
        .ts-hours { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.3rem; }
        .ts-hours-row { display: flex; justify-content: space-between; font-size: 0.82rem; }
        .ts-hours-day { color: var(--muted); }
        .ts-hours-time { color: var(--dark); }
        .ts-hours-off { color: var(--border); }
        .ts-map { position: relative; aspect-ratio: 4/3; min-height: 200px; background: var(--cream); border: 1px solid var(--border); overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .ts-map iframe { width: 100%; height: 100%; border: 0; }
        .ts-map.has-overlay iframe { pointer-events: none; }
        .ts-map-overlay { position: absolute; inset: 0; z-index: 1; }
        .ts-map-overlay:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }
        .ts-map-mobile-link {
          display: none; margin-top: 0.85rem;
          font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--gold-dk); font-weight: 500;
        }
        .ts-map-mobile-link:hover { color: var(--gold); }

        /* ── SOCIAL BAR ──────────────────────────────────────── */
        .ts-socbar { background: var(--cream); border-top: 1px solid var(--border); padding: 1.6rem 0; }
        .ts-socbar-inner { display: flex; align-items: center; justify-content: center; gap: 2.5rem; }
        .ts-soc-link { display: flex; align-items: center; gap: 0.6rem; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); transition: color 0.2s; }
        .ts-soc-link:hover { color: var(--gold); }
        .ts-soc-div { width: 1px; height: 16px; background: var(--border); }

        /* ── FOOTER ──────────────────────────────────────────── */
        .ts-footer { background: var(--dark); padding: 3rem 0 1.75rem; }
        .ts-footer-inner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; }
        .ts-footer-logo { height: 36px; width: auto; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.8; }
        .ts-footer-name { font-family: var(--serif); font-size: 1.5rem; color: var(--cream); opacity: 0.8; }
        .ts-footer-tag { font-size: 0.58rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold-lt); opacity: 0.4; }
        .ts-footer-nav { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; }
        .ts-footer-nav button { background: none; border: none; font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(250,248,244,0.3); transition: color 0.2s; padding: 0; }
        .ts-footer-nav button:hover { color: var(--cream); }
        .ts-footer-soc { display: flex; gap: 1.5rem; }
        .ts-footer-soc a { color: rgba(250,248,244,0.3); transition: color 0.2s; }
        .ts-footer-soc a:hover { color: var(--gold-lt); }
        .ts-footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.5rem; font-size: 0.62rem; color: rgba(250,248,244,0.2); display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }

        /* ── BUTTONS ─────────────────────────────────────────── */
        .ts-btn {
          display: inline-block; background: var(--dark); color: var(--white);
          font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
          font-weight: 500; padding: 0.9rem 2.2rem; border: none;
          transition: background 0.2s, transform 0.2s; text-decoration: none;
        }
        .ts-btn:hover { background: #333; transform: translateY(-2px); }
        .ts-btn-outline {
          display: inline-block; background: transparent; color: var(--dark);
          font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase;
          font-weight: 500; padding: 0.9rem 2.2rem;
          border: 1px solid var(--dark); transition: all 0.2s; text-decoration: none;
        }
        .ts-btn-outline:hover { background: var(--dark); color: var(--white); }

        /* ── RESPONSIVE ──────────────────────────────────────── */
        @media (max-width: 1024px) {
          .ts-hero { grid-template-columns: 1fr; min-height: auto; }
          .ts-hero-left { padding: 6rem 2rem 2.5rem; order: 2; }
          .ts-hero-right { order: 1; min-height: 55svh; }
          .ts-about-inner { grid-template-columns: 1fr; }
          .ts-about-img-wrap { min-height: 400px; }
          .ts-about-content { padding: 3rem 2rem; }
          .ts-contact-grid { grid-template-columns: 1fr; gap: 2.25rem; }
          .ts-prod-grid { grid-template-columns: 1fr; gap: 2px; }
        }
        @media (max-width: 768px) {
          .ts-nav { padding: 1.2rem 1.5rem; }
          .ts-nav.sc { padding: 0.9rem 1.5rem; }
          .ts-nav-links, .ts-nav-cta { display: none; }
          .ts-burger { display: flex; }
          .ts-svc-btn { grid-template-columns: 2.5rem 1fr 2rem; }
          .ts-svc-dur { display: none; }
          .ts-gal-item:nth-child(odd), .ts-gal-item:nth-child(even) { width: 240px; height: 320px; margin-top: 0; }
          .ts-map.has-overlay iframe { pointer-events: auto; }
          .ts-map.has-overlay .ts-map-overlay { display: none; }
          .ts-map-mobile-link { display: inline-block; }
          .ts-socbar-inner { gap: 1.5rem; flex-wrap: wrap; }
          .ts-hero-badge { bottom: 1rem; right: 1rem; }
          .ts-about-content { padding: 3rem 1.5rem; }
        }
        @media (max-width: 480px) {
          .ts-cta-phone { font-size: 1.5rem; padding: 0.8rem 1.5rem; }
          .ts-hero-actions { width: 100%; }
          .ts-hero-phone { font-size: 1.3rem; }
        }
      `}</style>

      {/* ── MOBILE MENU ── */}
      <div className={`ts-mob${menuOpen ? " open" : ""}`}>
        <button className="ts-mob-close" onClick={() => setMenuOpen(false)}>✕</button>
        {(tenant.about_text1 || tenant.about_image_url) && <button onClick={() => go("about")}>За мен</button>}
        <button onClick={() => go("services")}>Процедури</button>
        {products.length > 0 && <button onClick={() => go("products")}>Козметика</button>}
        {gallery.length > 0 && <button onClick={() => go("gallery")}>Галерия</button>}
        <button onClick={() => go("contact")}>Контакти</button>
        {phoneHref && <a href={phoneHref} className="ts-nav-cta" style={{ marginTop: "1rem" }}>Запазете час</a>}
      </div>

      {/* ── NAV ── */}
      <nav className={`ts-nav${scrolled ? " sc" : ""}`}>
        {tenant.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logo_url} alt={tenant.salon_name} className="ts-logo" onClick={() => go("hero")} />
        ) : (
          <span className="ts-logo-text" onClick={() => go("hero")}>{tenant.salon_name}</span>
        )}
        <ul className="ts-nav-links">
          {(tenant.about_text1 || tenant.about_image_url) && <li><button onClick={() => go("about")}>За мен</button></li>}
          <li><button onClick={() => go("services")}>Процедури</button></li>
          {products.length > 0 && <li><button onClick={() => go("products")}>Козметика</button></li>}
          {gallery.length > 0 && <li><button onClick={() => go("gallery")}>Галерия</button></li>}
          <li><button onClick={() => go("contact")}>Контакти</button></li>
        </ul>
        {phoneHref && <a href={phoneHref} className="ts-nav-cta">Запазете час</a>}
        <button className="ts-burger" onClick={() => setMenuOpen(true)} aria-label="Меню">
          <span /><span /><span />
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="ts-hero" id="hero">
        <div className="ts-hero-left">
          <p className="ts-hero-eyebrow">✦ Premium Facecare · Бургас</p>
          <div className="ts-rule" />
          <h1 className="ts-hero-title">
            {tenant.hero_title ? (
              <>{tenant.hero_title.split(".")[0]}.<br /><em>{tenant.hero_title.split(".")[1]?.trim() || tenant.hero_subtitle}</em></>
            ) : (
              <>Кожата помни<br /><em>всяка грижа.</em></>
            )}
          </h1>
          {tenant.hero_subtitle && !tenant.hero_title?.includes(tenant.hero_subtitle) && (
            <p className="ts-hero-sub">{tenant.hero_subtitle}</p>
          )}
          {tenant.description && <p className="ts-hero-sub" style={{ marginTop: 0 }}>{tenant.description}</p>}
          <div className="ts-hero-actions">
            {phoneHref && (
              <a href={phoneHref} className="ts-hero-phone">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {phone}
              </a>
            )}
            <p className="ts-hero-note">Всеки ден · 09:00 – 19:00</p>
          </div>
        </div>
        <div className="ts-hero-right">
          {tenant.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.hero_image_url} alt={tenant.salon_name} className="ts-hero-img" />
          ) : (
            <div className="ts-hero-img" style={{ background: "linear-gradient(160deg, #EDE8E0, #D9D0BC)" }} />
          )}
          <div className="ts-hero-overlay" />
          <div className="ts-hero-badge">The Skin · Premium Facecare</div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && (
        <section className="ts-about" id="about">
          <div className="ts-about-inner">
            <div className="ts-about-img-wrap">
              {tenant.about_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.about_image_url} alt="За мен" className="ts-about-img" />
              ) : (
                <div className="ts-about-img-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </div>
              )}
              <div className="ts-about-label">Skin Expert · Бургас</div>
            </div>
            <div className="ts-about-content">
              <div ref={r1} data-reveal="1">
                <p className="ts-about-tag">За мен</p>
                <div className="ts-rule" />
                <h2 className="ts-about-name">Валентина<br /><em>Skin Expert</em></h2>
                {tenant.about_text1 && <p className="ts-about-text">{tenant.about_text1}</p>}
                {tenant.about_text2 && <p className="ts-about-text">{tenant.about_text2}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      {services.length > 0 && (
        <section className="ts-services" id="services">
          <div className="ts-wrap">
            <div ref={r2} data-reveal="1" className="ts-sec-hdr">
              <span className="ts-sec-tag">Процедури</span>
              <div className="ts-rule ts-rule-c" />
              <h2 className="ts-sec-title">Нашите <em>терапии</em></h2>
            </div>
            <div className="ts-svc-list">
              {services.map((s, i) => <ServiceRow key={s.id} s={s} idx={i} />)}
            </div>
            <div className="ts-svc-cta">
              {phoneHref && (
                <a href={phoneHref} className="ts-btn">Запишете се на час</a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── PRODUCTS ── */}
      {products.length > 0 && (
        <section className="ts-products" id="products">
          <div className="ts-wrap">
            <div ref={r3} data-reveal="1" className="ts-sec-hdr">
              <span className="ts-sec-tag">Козметика</span>
              <div className="ts-rule ts-rule-c" />
              <h2 className="ts-sec-title">The Skin <em>линия</em></h2>
            </div>
            <div className="ts-prod-grid">
              {products.map((p, i) => (
                <div className="ts-prod-card" key={i}>
                  {p.imageUrl ? (
                    <div className="ts-prod-img-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt={p.name ? `${p.name} — снимка` : "Продукт"}
                        className="ts-prod-img"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="ts-prod-num">0{i + 1}</div>
                  <div className="ts-prod-name">{p.name}</div>
                  <div className="ts-prod-sub">{p.subtitle}</div>
                  <p className="ts-prod-desc">{p.description}</p>
                </div>
              ))}
            </div>
            {productsLink && (
              <div className="ts-prod-cta">
                <a className="ts-btn-outline" href={productsLink} target="_blank" rel="noopener noreferrer">
                  Виж всички продукти →
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section className="ts-testimonials" id="testimonials">
          <div ref={r4} data-reveal="1" className="ts-car-hdr">
            <span className="ts-car-tag">Отзиви</span>
            <div className="ts-rule ts-rule-c" style={{ background: "rgba(201,160,106,0.3)" }} />
            <h2 className="ts-car-title">Те го <em>казват</em></h2>
          </div>
          <Carousel items={testimonials} />
        </section>
      )}

      {/* ── GALLERY ── */}
      {gallery.length > 0 && (
        <section className="ts-gallery" id="gallery">
          <div className="ts-wrap">
            <div ref={r5} data-reveal="1" className="ts-sec-hdr">
              <span className="ts-sec-tag">Галерия</span>
              <div className="ts-rule ts-rule-c" />
              <h2 className="ts-sec-title">Резултати <em>в снимки</em></h2>
            </div>
          </div>
          <div className="ts-gal-scroll">
            <div className="ts-gal-inner">
              {gallery.map((g) => (
                <div className="ts-gal-item" key={g.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" loading="lazy" />
                  <div className="ts-gal-overlay" />
                </div>
              ))}
            </div>
          </div>
          {igHref && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <a href={igHref} target="_blank" rel="noopener noreferrer" className="ts-btn-outline">
                Повече в Instagram →
              </a>
            </div>
          )}
        </section>
      )}

      {/* ── CTA BLOCK ── */}
      <section className="ts-cta" id="booking">
        <div className="ts-wrap">
          <span className="ts-cta-tag">Запазете час</span>
          <div className="ts-rule ts-rule-c" style={{ background: "rgba(255,255,255,0.3)" }} />
          <h2 className="ts-cta-title">Готови ли сте за <em>трансформация?</em></h2>
          <p className="ts-cta-sub">Обадете се и запазете своя час при Валентина.</p>
          {phoneHref && (
            <div>
              <a href={phoneHref} className="ts-cta-phone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {phone}
              </a>
              <p className="ts-cta-note">Всеки ден · 09:00 – 19:00</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="ts-contact" id="contact">
        <div className="ts-wrap">
          <div ref={r6} data-reveal="1" className="ts-contact-grid">
            <div>
              <p className="ts-contact-tag">Контакти</p>
              <div className="ts-rule" />
              <h2 className="ts-contact-title">Намерете <em>ни</em></h2>

              {tenant.address && (
                <div className="ts-info-row">
                  <svg className="ts-info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div><div className="ts-info-lbl">Адрес</div><div className="ts-info-val">{tenant.address}</div></div>
                </div>
              )}
              {phone && (
                <div className="ts-info-row">
                  <svg className="ts-info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <div><div className="ts-info-lbl">Телефон</div><div className="ts-info-val"><a href={phoneHref ?? undefined}>{phone}</a></div></div>
                </div>
              )}
              {tenant.email && (
                <div className="ts-info-row">
                  <svg className="ts-info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <div><div className="ts-info-lbl">Имейл</div><div className="ts-info-val"><a href={`mailto:${tenant.email}`}>{tenant.email}</a></div></div>
                </div>
              )}
              {workingHours.length > 0 && (
                <div className="ts-info-row">
                  <svg className="ts-info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <div className="ts-info-lbl">Работно Време</div>
                    <div className="ts-hours">
                      {workingHours.map(wh => (
                        <div className="ts-hours-row" key={wh.id}>
                          <span className="ts-hours-day">{DAY_BG[wh.day_of_week]}</span>
                          <span className={wh.is_day_off ? "ts-hours-off" : "ts-hours-time"}>
                            {wh.is_day_off ? "Почивен" : `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className={`ts-map${mapsDirectionsHref ? " has-overlay" : ""}`}>
                {effectiveMapsSrc ? (
                  <>
                    <iframe
                      src={effectiveMapsSrc}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Карта"
                    />
                    {mapsDirectionsHref && (
                      <a
                        href={mapsDirectionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ts-map-overlay"
                        aria-label="Отвори маршрут в Google Карти"
                      />
                    )}
                  </>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--gold)", opacity: 0.4 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                )}
              </div>
              {mapsDirectionsHref && (
                <a
                  href={mapsDirectionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ts-map-mobile-link"
                >
                  Маршрут в Google Карти →
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL BAR ── */}
      {(igHref || fbHref) && (
        <div className="ts-socbar">
          <div className="ts-socbar-inner">
            {igHref && (
              <>
                <a href={igHref} target="_blank" rel="noopener noreferrer" className="ts-soc-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                  Instagram
                </a>
                {fbHref && <div className="ts-soc-div" />}
              </>
            )}
            {fbHref && (
              <a href={fbHref} target="_blank" rel="noopener noreferrer" className="ts-soc-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                Facebook
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="ts-footer">
        <div className="ts-wrap">
          <div className="ts-footer-inner">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.salon_name} className="ts-footer-logo" />
            ) : (
              <span className="ts-footer-name">{tenant.salon_name}</span>
            )}
            <p className="ts-footer-tag">✦ Premium Facecare ✦</p>
            <nav className="ts-footer-nav">
              {(tenant.about_text1 || tenant.about_image_url) && <button onClick={() => go("about")}>За мен</button>}
              <button onClick={() => go("services")}>Процедури</button>
              {products.length > 0 && <button onClick={() => go("products")}>Козметика</button>}
              {gallery.length > 0 && <button onClick={() => go("gallery")}>Галерия</button>}
              <button onClick={() => go("contact")}>Контакти</button>
            </nav>
            <div className="ts-footer-soc">
              {igHref && (
                <a href={igHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                </a>
              )}
              {fbHref && (
                <a href={fbHref} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
            </div>
            <div className="ts-footer-bottom">
              <span>© {new Date().getFullYear()} {tenant.salon_name}</span>
              <span>·</span>
              <span>Всички права запазени</span>
              <span>·</span>
              <a href="https://salonapp.pro" style={{ color: "inherit" }}>SalonApp.pro</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
