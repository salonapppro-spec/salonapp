"use client";

import { useState, useEffect } from "react";
import type { SalonData } from "@/types/database";
import { servicesFlatForPublic } from "@/components/templates/salon-shared";
import { BookingCalendar } from "@/components/templates/BookingCalendar";
import {
  safeFacebookHref,
  safeGoogleMapsEmbedSrc,
  safeInstagramHref,
  safeTiktokHref,
} from "@/lib/safe-public-urls";

const DAY_LABELS = ["Неделя","Понеделник","Вторник","Сряда","Четвъртък","Петък","Събота"] as const;

function mapsEmbedFromAddress(address: string): string {
  return `https://maps.google.com/maps?hl=bg&q=${encodeURIComponent(address)}&t=m&z=17&ie=UTF8&iwloc=B&output=embed`;
}

function resolveMapsSrc(
  tenantEmbed: string | null | undefined,
  address: string,
): string {
  const tenantMapsSrc = safeGoogleMapsEmbedSrc(tenantEmbed);
  const officialPbEmbed =
    tenantMapsSrc?.startsWith("https://www.google.com/maps/embed?pb=")
      ? tenantMapsSrc
      : null;
  return officialPbEmbed ?? mapsEmbedFromAddress(address);
}

const BEFORE_AFTER_IMGS = [
  "https://ncnmqufixlfovfrbykyc.supabase.co/storage/v1/object/public/gallery/magnetic-eyes/938debf4-e387-406f-acf4-2d9dc6144cb2.webp",
  "https://ncnmqufixlfovfrbykyc.supabase.co/storage/v1/object/public/gallery/magnetic-eyes/c28a860d-26cf-4221-91c2-ce71c693430f.webp",
  "https://ncnmqufixlfovfrbykyc.supabase.co/storage/v1/object/public/gallery/magnetic-eyes/bbeaa61e-da6e-46a0-86ed-fbadea117931.webp",
];

const HARDCODED_SERVICES = [
  {
    id: "me-1", name: "Микроблейдинг", price_eur: 180,
    desc: "Естествена форма и плътност с косъм по косъм техника. Идеален за постигане на вежди с естествен вид, съобразени с лицето ви.",
    duration: "2 – 2.5 часа", durability: "12 – 18 месеца",
  },
  {
    id: "me-2", name: "Перманентен грим — устни", price_eur: 220,
    desc: "Подчертаваме естествената красота на устните, очертаваме контура и придаваме нежен пигмент, съобразен с вашия стил.",
    duration: "2.5 – 3 часа", durability: "2 – 4 години",
  },
  {
    id: "me-3", name: "Перманентен грим — очна линия", price_eur: 160,
    desc: "Фини и прецизни линии, които подчертават погледа и спестяват време всяка сутрин.",
    duration: "1.5 – 2 часа", durability: "2 – 3 години",
  },
  {
    id: "me-4", name: "Powder Brows", price_eur: 180,
    desc: "Мека пудрена техника за плътен и дефиниран вид на веждите с естествен градиент.",
    duration: "2 – 2.5 часа", durability: "12 – 18 месеца",
  },
  {
    id: "me-5", name: "Ретуш", price_eur: 80,
    desc: "Препоръчителен ретуш за перфектен и дълготраен резултат.",
    duration: "1 – 1.5 часа", durability: "6 – 8 седм. след процедурата",
  },
];

const TESTIMONIALS = [
  { name: "Ивана Д.", service: "Микроблейдинг вежди", text: "За първи път се чувствам толкова уверена без грим. Резултатът е изключително естествен и красив. Мария е истински професионалист!" },
  { name: "Виктория П.", service: "Перманентен грим устни", text: "Мария работи с невероятно внимание към детайла. Цялото преживяване беше спокойно, луксозно и професионално." },
  { name: "Симона К.", service: "Мигли обем 3D", text: "Миглите ми са перфектни! Леки, удобни и точно както исках. Препоръчвам с две ръце!" },
  { name: "Ралица Т.", service: "Микроблейдинг вежди", text: "Естествена форма и перфектен цвят. Получавам комплименти всеки ден!" },
];

const FAQ_ITEMS = [
  { q: "Боли ли по време на процедурата?", a: "Работим с висококачествени обезболяващи продукти, за да осигурим максимален комфорт по време на процедурата. Повечето клиентки усещат лек дискомфорт, но не и силна болка." },
  { q: "Колко време се задържа резултатът?", a: "Трайността зависи от типа кожа, начина на живот и грижата след процедурата. Средно резултатите се запазват между 12 и 24 месеца." },
  { q: "Колко време трае възстановяването?", a: "Първите дни е възможно леко зачервяване и по-интензивен цвят. Пълното възстановяване обикновено отнема между 7 и 14 дни." },
  { q: "Как да се подготвя преди процедура?", a: "Препоръчително е да избягваш алкохол, кофеин и солариум поне 24 часа преди процедурата. Ще получиш подробни инструкции след запазване на час." },
  { q: "Има ли нужда от ретуш?", a: "Да. За максимално красив и дълготраен резултат препоръчваме ретуш между 4 и 8 седмици след първата процедура." },
  { q: "Мога ли да комбинирам различни процедури?", a: "Да, при консултация можем да изготвим индивидуален план според желания резултат, състоянието на кожата и подходящия период между процедурите." },
  { q: "Подходящи ли са процедурите за всички типове кожа?", a: "В повечето случаи да, но подходът се съобразява индивидуално. При много мазна, чувствителна или проблемна кожа може да се препоръча различна техника." },
];

export function MagneticEyesSite({ data }: { data: SalonData }) {
  const { tenant, workingHours } = data;
  const services = servicesFlatForPublic(data);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("me-no-x-scroll");
    document.body.classList.add("me-no-x-scroll");

    return () => {
      document.documentElement.classList.remove("me-no-x-scroll");
      document.body.classList.remove("me-no-x-scroll");
    };
  }, []);

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  const tkHref = safeTiktokHref(tenant.tiktok_url);
  const heroImg = tenant.hero_image_url?.trim() || null;
  const aboutImg = tenant.about_image_url?.trim() || null;
  const logoImg = tenant.logo_url?.trim() || null;
  const phone = tenant.phone ?? "+359 897 777 777";
  const email = tenant.email ?? "magneticeyes@gmail.com";
  const address = tenant.address ?? 'ул. „Искра" 12, гр. Казанлък';
  const mapsSrc = resolveMapsSrc(tenant.google_maps_embed, address);
  const instagramHandle = "@magneticeyes.studio";

  const navLinks = [
    { label: "НАЧАЛО", href: "#home" },
    { label: "УСЛУГИ", href: "#services" },
    { label: "ЗА НАС", href: "#about" },
    { label: "РЕЗУЛТАТИ", href: "#results" },
    { label: "ОТЗИВИ", href: "#reviews" },
    { label: "ЧЗВ", href: "#faq" },
    { label: "КОНТАКТИ", href: "#contact" },
  ];

  return (
    <>
      <style>{`
        /* ─── MAGNETIC EYES — base ─── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html.me-no-x-scroll,
        body.me-no-x-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        .me-root {
          --me-dark: #0D0B08;
          --me-dark2: #181410;
          --me-cream: #F5EDE3;
          --me-ivory: #FAF6F0;
          --me-gold: #C4907A;
          --me-gold2: #D4A898;
          --me-gold-dim: rgba(196,144,122,0.18);
          --me-text-dark: #1A1008;
          --me-text-cream: #F5EDE3;
          --me-serif: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          --me-sans: 'Inter', 'DM Sans', sans-serif;
          background: var(--me-cream);
          color: var(--me-text-dark);
          font-family: var(--me-sans);
          width: 100%;
          max-width: 100%;
          position: relative;
          overflow-x: hidden;
        }

        /* ─── NAV ─── */
        .me-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 72px; padding: 0 32px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.35s, backdrop-filter 0.35s, box-shadow 0.35s;
        }
        .me-nav.scrolled {
          background: rgba(13,11,8,0.94);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 rgba(196,151,63,0.15);
        }
        .me-nav-logo { height: 52px; width: auto; display: block; }
        .me-nav-name {
          font-family: var(--me-serif); font-size: 22px; font-weight: 600;
          color: var(--me-gold); letter-spacing: 0.04em; text-decoration: none;
        }
        .me-nav-links {
          display: none; gap: 32px; align-items: center;
        }
        @media (min-width: 1024px) { .me-nav-links { display: flex; } }
        .me-nav-link {
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
          color: rgba(245,237,227,0.75); text-decoration: none;
          transition: color 0.18s;
          font-family: var(--me-sans);
        }
        .me-nav-link:hover { color: var(--me-gold); }
        .me-nav-cta {
          padding: 10px 24px;
          background: var(--me-gold); color: #fff;
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
          text-decoration: none; border-radius: 4px;
          transition: background 0.18s;
        }
        .me-nav-cta:hover { background: var(--me-gold2); }
        .me-hamburger {
          background: none; border: none; cursor: pointer;
          color: var(--me-text-cream); padding: 8px; line-height: 1;
        }
        @media (min-width: 1024px) { .me-hamburger { display: none; } }
        .me-mobile-menu {
          display: none; flex-direction: column;
          position: fixed; top: 72px; left: 0; right: 0; z-index: 199;
          background: rgba(13,11,8,0.97);
          backdrop-filter: blur(20px);
          padding: 16px 32px 28px; gap: 0;
          border-bottom: 1px solid var(--me-gold-dim);
        }
        .me-mobile-menu.open { display: flex; }
        .me-mobile-link {
          padding: 15px 4px; font-size: 13px; letter-spacing: 0.16em;
          font-weight: 700; font-family: var(--me-sans);
          color: rgba(245,237,227,0.75); text-decoration: none;
          border-bottom: 1px solid rgba(196,151,63,0.1);
          transition: color 0.15s;
        }
        .me-mobile-link:hover { color: var(--me-gold); }
        .me-mobile-cta {
          margin-top: 18px; padding: 14px;
          background: var(--me-gold); color: #fff;
          text-align: center; text-decoration: none;
          font-weight: 700; font-size: 13px; letter-spacing: 0.16em;
          border-radius: 4px;
        }

        /* ─── HERO ─── */
        .me-hero {
          position: relative; min-height: 100svh;
          display: flex; flex-direction: column;
          background: var(--me-dark);
          overflow: hidden;
        }
        .me-hero-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center top;
        }
        @media (max-width: 640px) {
          .me-hero-bg { background-position: 86% top; }
        }
        .me-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            105deg,
            rgba(13,11,8,0.88) 0%,
            rgba(13,11,8,0.65) 45%,
            rgba(13,11,8,0.20) 100%
          );
        }
        @media (max-width: 640px) {
          .me-hero-overlay {
            background: linear-gradient(
              105deg,
              rgba(13,11,8,0.88) 0%,
              rgba(13,11,8,0.70) 50%,
              rgba(13,11,8,0.28) 100%
            );
          }
        }
        .me-hero-content {
          position: relative; z-index: 2;
          flex: 1; display: flex; flex-direction: column;
          justify-content: center;
          padding: 120px 48px 60px;
          max-width: 680px;
        }
        @media (max-width: 640px) { .me-hero-content { padding: 110px 24px 60px; } }
        .me-hero-overline {
          font-size: 11px; font-weight: 700; letter-spacing: 0.28em;
          text-transform: uppercase; color: var(--me-gold);
          margin-bottom: 20px; font-family: var(--me-sans);
        }
        .me-hero-title {
          font-family: var(--me-serif); font-size: clamp(48px, 7vw, 86px);
          font-weight: 700; line-height: 1.05;
          color: var(--me-text-cream);
          margin-bottom: 18px;
        }
        .me-hero-divider {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 22px;
        }
        .me-hero-divider-line {
          width: 48px; height: 1px; background: var(--me-gold);
        }
        .me-hero-divider-diamond {
          width: 6px; height: 6px; background: var(--me-gold);
          transform: rotate(45deg);
        }
        .me-hero-sub {
          font-size: 16px; line-height: 1.75;
          color: rgba(245,237,227,0.72);
          margin-bottom: 40px; max-width: 440px;
          font-family: var(--me-sans);
        }
        .me-hero-btns {
          display: flex; gap: 14px; flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .me-hero-btns { flex-direction: column; align-items: stretch; }
          .me-hero-btns .me-btn-gold,
          .me-hero-btns .me-btn-outline-cream { width: 100%; }
        }
        .me-btn-gold {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px;
          background: var(--me-gold); color: #fff;
          font-size: 12px; font-weight: 700; letter-spacing: 0.18em;
          text-decoration: none; border-radius: 4px;
          transition: background 0.2s, transform 0.15s;
          max-width: 100%;
          justify-content: center;
          text-align: center;
          white-space: normal;
        }
        .me-btn-gold:hover { background: var(--me-gold2); transform: translateY(-2px); }
        .me-btn-outline-cream {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 30px;
          background: transparent; color: var(--me-text-cream);
          border: 1.5px solid rgba(245,237,227,0.4);
          font-size: 12px; font-weight: 700; letter-spacing: 0.18em;
          text-decoration: none; border-radius: 4px;
          transition: border-color 0.2s, background 0.2s;
          max-width: 100%;
          justify-content: center;
          text-align: center;
          white-space: normal;
        }
        .me-btn-outline-cream:hover {
          border-color: var(--me-gold);
          background: rgba(196,151,63,0.08);
        }
        .me-hero-badges {
          position: relative; z-index: 2;
          display: flex; gap: 0;
          border-top: 1px solid rgba(196,151,63,0.18);
        }
        .me-hero-badge {
          flex: 1; padding: 22px 24px;
          border-right: 1px solid rgba(196,151,63,0.18);
          display: flex; flex-direction: column; gap: 4px;
        }
        .me-hero-badge:last-child { border-right: none; }
        .me-badge-icon {
          color: var(--me-gold); margin-bottom: 6px; line-height: 1;
        }
        .me-badge-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--me-text-cream);
          font-family: var(--me-sans);
        }
        .me-badge-sub {
          font-size: 12px; color: rgba(245,237,227,0.5);
          font-family: var(--me-sans);
        }
        @media (max-width: 480px) {
          .me-hero-badges { flex-direction: column; }
          .me-hero-badge { border-right: none; border-bottom: 1px solid rgba(196,151,63,0.18); }
          .me-hero-badge:last-child { border-bottom: none; }
        }

        /* ─── SECTION COMMON ─── */
        .me-section-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--me-gold);
          text-align: center; margin-bottom: 12px;
          font-family: var(--me-sans);
        }
        .me-section-divider {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 16px;
        }
        .me-section-divider-line { width: 32px; height: 1px; background: var(--me-gold); }
        .me-section-divider-dot { width: 5px; height: 5px; background: var(--me-gold); transform: rotate(45deg); }
        .me-section-title {
          font-family: var(--me-serif); font-size: clamp(30px, 4vw, 50px);
          font-weight: 700; line-height: 1.15; text-align: center;
          margin-bottom: 12px;
        }
        .me-section-title .me-gold-dot { color: var(--me-gold); }
        .me-section-sub {
          font-size: 15px; line-height: 1.7; text-align: center;
          opacity: 0.6; max-width: 560px; margin: 0 auto 52px;
          font-family: var(--me-sans);
        }

        /* ─── ABOUT ─── */
        .me-about {
          background: var(--me-cream);
          padding: 30px 24px;
        }
        .me-about-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr;
          gap: 64px; align-items: center;
        }
        .me-about-inner > * { min-width: 0; }
        @media (min-width: 900px) {
          .me-about-inner { grid-template-columns: 1fr 1fr; }
        }
        .me-about-img-wrap { position: relative; }
        .me-about-img {
          width: 100%; height: 580px; object-fit: cover;
          object-position: top center;
          border-radius: 6px; display: block;
          box-shadow: 0 24px 64px rgba(26,16,8,0.18);
        }
        .me-about-img-placeholder {
          width: 100%; height: 580px; border-radius: 6px;
          background: linear-gradient(135deg, #1a1210 0%, #2a1e14 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 64px;
        }
        .me-about-overline {
          font-size: 10px; font-weight: 700; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--me-gold);
          margin-bottom: 8px; font-family: var(--me-sans);
        }
        .me-about-title {
          font-family: var(--me-serif); font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 700; line-height: 1.2;
          color: var(--me-text-dark); margin-bottom: 24px;
        }
        .me-about-title .me-gold-dot { color: var(--me-gold); }
        .me-about-body {
          font-size: 16px; line-height: 1.82; color: rgba(26,16,8,0.72);
          margin-bottom: 32px; font-family: var(--me-sans);
        }
        .me-about-stats {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1px; margin-bottom: 32px;
          border: 1px solid rgba(196,151,63,0.2);
          border-radius: 8px; overflow: hidden;
        }
        @media (max-width: 640px) { .me-about-stats { grid-template-columns: 1fr; } }
        .me-about-stat {
          background: #fff; padding: 20px 16px; text-align: center;
        }
        .me-about-stat-icon {
          color: var(--me-gold); margin-bottom: 8px; line-height: 1;
        }
        .me-about-stat-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--me-text-dark);
          margin-bottom: 6px; line-height: 1.4; font-family: var(--me-sans);
          overflow-wrap: anywhere;
        }
        .me-about-stat-sub {
          font-size: 12px; color: rgba(26,16,8,0.5);
          line-height: 1.5; font-family: var(--me-sans);
          overflow-wrap: anywhere;
        }
        .me-about-quote {
          background: var(--me-dark); border-radius: 8px;
          padding: 28px 28px 24px;
          border-left: 3px solid var(--me-gold);
        }
        .me-about-quote-mark {
          font-family: var(--me-serif); font-size: 48px;
          color: var(--me-gold); line-height: 0.6;
          margin-bottom: 12px; display: block;
        }
        .me-about-quote-text {
          font-family: var(--me-serif); font-size: 17px;
          font-style: italic; color: var(--me-text-cream);
          line-height: 1.65; margin-bottom: 16px;
        }
        .me-about-quote-sig {
          font-family: 'Dancing Script', cursive; font-size: 20px;
          color: var(--me-gold);
        }

        /* ─── RESULTS ─── */
        .me-results { background: var(--me-ivory); padding: 30px 24px; }
        .me-results-inner { max-width: 1100px; margin: 0 auto; }
        .me-ba-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 20px; margin-bottom: 64px;
        }
        @media (min-width: 640px) { .me-ba-grid { grid-template-columns: repeat(3, 1fr); } }
        .me-ba-card {
          border-radius: 10px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(26,16,8,0.10);
        }
        .me-ba-visual {
          position: relative; overflow: hidden; background: #1a1008;
        }
        .me-ba-img-full {
          display: block; width: 100%; height: auto;
        }
        .me-ba-placeholder {
          height: 220px;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; opacity: 0.15; color: #fff;
          background: linear-gradient(135deg, #2a1e14 50%, #3d2b1a 50%);
        }
        .me-gallery-label {
          display: flex; align-items: center; gap: 16px;
          justify-content: center; margin-bottom: 6px;
        }
        .me-gallery-label-line { flex: 1; max-width: 60px; height: 1px; background: var(--me-gold); }
        .me-gallery-label-text {
          font-size: 10px; font-weight: 700; letter-spacing: 0.3em;
          color: var(--me-gold); font-family: var(--me-sans);
        }
        .me-gallery-sub {
          font-size: 13px; color: rgba(26,16,8,0.5);
          text-align: center; margin-bottom: 28px;
          font-family: var(--me-sans);
        }
        .me-gallery-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 640px) {
          .me-gallery-strip { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .me-gallery-strip { grid-template-columns: repeat(3, 1fr); }
        }
        .me-gallery-item {
          aspect-ratio: 1; border-radius: 8px;
          overflow: hidden; position: relative;
          background: linear-gradient(135deg, #2a1e14, #1a1008);
        }
        .me-gallery-item img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; transition: transform 0.45s ease;
        }
        .me-gallery-item:hover img { transform: scale(1.07); }
        .me-gallery-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; opacity: 0.4;
        }
        .me-results-cta-banner {
          margin-top: 52px;
          background: var(--me-ivory);
          border: 1px solid rgba(196,151,63,0.2);
          border-radius: 10px; padding: 28px 32px;
          display: flex; align-items: center; gap: 20px;
          flex-wrap: wrap; justify-content: center;
        }
        .me-results-cta-icon { color: var(--me-gold); font-size: 28px; flex-shrink: 0; }
        .me-results-cta-text { flex: 1; min-width: 200px; }
        .me-results-cta-title {
          font-family: var(--me-serif); font-size: 22px;
          font-weight: 700; color: var(--me-text-dark); margin-bottom: 4px;
        }
        .me-results-cta-sub {
          font-size: 14px; color: rgba(26,16,8,0.55);
          font-family: var(--me-sans);
        }

        /* ─── SERVICES ─── */
        .me-services { background: var(--me-cream); padding: 0; overflow: hidden; }
        .me-services-inner {
          max-width: 960px; margin: 0 auto;
        }
        .me-services-photo {
          position: relative; min-height: 380px;
          background: var(--me-dark);
          overflow: hidden;
        }
        .me-services-photo img {
          width: 100%; height: 100%; object-fit: cover;
          object-position: top center;
          display: block; opacity: 0.85;
        }
        .me-services-photo-placeholder {
          width: 100%; height: 100%;
          background: linear-gradient(160deg, #1a1008 0%, #2a1810 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 64px;
        }
        .me-services-photo-card {
          position: absolute; bottom: 24px; left: 24px; right: 24px;
          background: rgba(13,11,8,0.88);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(196,151,63,0.25);
          border-radius: 8px; padding: 20px 22px;
        }
        .me-services-photo-card-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.28em;
          text-transform: uppercase; color: var(--me-gold);
          margin-bottom: 8px; font-family: var(--me-sans);
        }
        .me-services-photo-card-title {
          font-size: 15px; font-weight: 700;
          color: var(--me-text-cream); margin-bottom: 6px;
          font-family: var(--me-sans);
        }
        .me-services-photo-card-text {
          font-size: 13px; color: rgba(245,237,227,0.55);
          line-height: 1.55; margin-bottom: 12px;
          font-family: var(--me-sans);
        }
        .me-services-photo-card-sig {
          font-family: 'Dancing Script', cursive; font-size: 18px;
          color: var(--me-gold);
        }
        .me-services-right {
          padding: 30px 48px;
          background: var(--me-ivory);
        }
        @media (max-width: 900px) { .me-services-right { padding: 30px 24px; } }
        .me-service-list { display: flex; flex-direction: column; gap: 0; }
        .me-service-item {
          padding: 28px 0; border-bottom: 1px solid rgba(196,151,63,0.14);
          display: grid; grid-template-columns: 1fr auto;
          gap: 16px; align-items: start;
        }
        .me-service-item > * { min-width: 0; }
        .me-service-item:last-child { border-bottom: none; }
        .me-service-num {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
          color: var(--me-gold); margin-bottom: 6px;
          font-family: var(--me-sans);
        }
        .me-service-name {
          font-size: 13px; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--me-text-dark);
          margin-bottom: 8px; font-family: var(--me-sans);
        }
        .me-service-desc {
          font-size: 13px; line-height: 1.65; color: rgba(26,16,8,0.58);
          margin-bottom: 12px; font-family: var(--me-sans);
        }
        .me-service-meta {
          display: flex; gap: 20px; flex-wrap: wrap;
        }
        .me-service-meta-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: rgba(26,16,8,0.5);
          font-family: var(--me-sans);
        }
        .me-service-meta-icon { color: var(--me-gold); font-size: 13px; }
        .me-service-price-col {
          text-align: right; flex-shrink: 0;
          display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
        }
        .me-service-price {
          font-family: var(--me-serif); font-size: 32px;
          font-weight: 700; color: var(--me-text-dark); line-height: 1;
          white-space: nowrap;
        }
        .me-service-price span {
          font-size: 18px; font-weight: 400;
          color: rgba(26,16,8,0.45); margin-right: 4px;
        }
        .me-btn-dark-sm {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px;
          background: var(--me-dark); color: var(--me-text-cream);
          font-size: 10px; font-weight: 700; letter-spacing: 0.16em;
          text-decoration: none; border-radius: 3px;
          transition: background 0.18s;
          max-width: 100%;
          justify-content: center;
          text-align: center;
          white-space: normal;
        }
        .me-btn-dark-sm:hover { background: var(--me-dark2); }
        .me-services-benefits {
          background: var(--me-dark); padding: 28px 48px;
          display: flex; gap: 0; flex-wrap: wrap;
          border-top: 1px solid rgba(196,151,63,0.15);
          grid-column: 1 / -1;
        }
        .me-benefit {
          flex: 1; min-width: 160px; padding: 20px 16px;
          border-right: 1px solid rgba(196,151,63,0.12);
          text-align: center;
        }
        .me-benefit:last-child { border-right: none; }
        .me-benefit-icon { color: var(--me-gold); margin-bottom: 8px; }
        .me-benefit-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--me-text-cream);
          margin-bottom: 4px; font-family: var(--me-sans);
        }
        .me-benefit-sub {
          font-size: 11px; color: rgba(245,237,227,0.4);
          font-family: var(--me-sans);
        }
        @media (max-width: 640px) {
          .me-service-item { grid-template-columns: 1fr; }
          .me-service-price-col { align-items: flex-start; text-align: left; }
          .me-services-benefits { padding: 20px 24px; }
          .me-benefit { min-width: 50%; border-right: none; border-bottom: 1px solid rgba(196,151,63,0.12); }
          .me-benefit:last-child { border-bottom: none; }
        }

        /* ─── REVIEWS ─── */
        .me-reviews { background: var(--me-cream); padding: 30px 24px; }
        .me-reviews-inner { max-width: 1100px; margin: 0 auto; }
        .me-reviews-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 900px) {
          .me-reviews-grid { grid-template-columns: 1fr 1fr; gap: 48px; }
        }
        .me-review-featured {
          display: flex; flex-direction: column; gap: 0;
        }
        .me-review-photo {
          width: 100%; height: 340px; object-fit: cover;
          border-radius: 8px; display: block;
          background: linear-gradient(135deg, #2a1e14, #1a1008);
        }
        .me-review-photo-placeholder {
          width: 100%; height: 340px; border-radius: 8px;
          background: linear-gradient(135deg, #2a1e14, #1a1008);
          display: flex; align-items: center; justify-content: center;
          font-size: 48px;
        }
        .me-review-card-main {
          background: #fff; border-radius: 10px;
          padding: 32px 32px 28px;
          margin-top: 24px;
          box-shadow: 0 8px 32px rgba(26,16,8,0.07);
        }
        .me-review-quote-mark {
          font-family: var(--me-serif); font-size: 64px;
          color: var(--me-gold); line-height: 0.5;
          margin-bottom: 16px; display: block;
        }
        .me-review-text {
          font-family: var(--me-serif); font-size: 19px;
          font-style: italic; line-height: 1.6;
          color: var(--me-text-dark); margin-bottom: 20px;
        }
        .me-review-divider { width: 40px; height: 1px; background: var(--me-gold); margin-bottom: 16px; }
        .me-review-nav { display: flex; gap: 8px; margin-top: 16px; }
        .me-review-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(26,16,8,0.18); border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .me-review-dot.active { background: var(--me-gold); }
        .me-review-arr {
          width: 36px; height: 36px; border-radius: 50%;
          background: #fff; border: 1px solid rgba(196,151,63,0.3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--me-text-dark);
          transition: background 0.18s;
        }
        .me-review-arr:hover { background: var(--me-gold-dim); }
        .me-review-author-name {
          font-weight: 700; font-size: 15px; color: var(--me-text-dark);
          font-family: var(--me-sans);
        }
        .me-review-author-service {
          font-size: 12px; color: var(--me-gold);
          font-family: var(--me-sans);
        }
        .me-reviews-right { display: flex; flex-direction: column; gap: 16px; }
        .me-review-card-sm {
          background: #fff; border-radius: 10px;
          padding: 22px 24px;
          box-shadow: 0 4px 16px rgba(26,16,8,0.06);
          display: flex; flex-direction: column; gap: 12px;
        }
        .me-review-card-sm-header {
          display: flex; align-items: center; gap: 12px;
        }
        .me-review-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          background: linear-gradient(135deg, var(--me-gold), #8B6B2F);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #fff;
        }
        .me-review-sm-name {
          font-size: 14px; font-weight: 700; color: var(--me-text-dark);
          font-family: var(--me-sans); margin-bottom: 2px;
        }
        .me-review-sm-service {
          font-size: 11px; color: var(--me-gold);
          font-family: var(--me-sans);
        }
        .me-review-stars { color: var(--me-gold); font-size: 13px; letter-spacing: 2px; }
        .me-review-sm-text {
          font-size: 14px; line-height: 1.65; color: rgba(26,16,8,0.65);
          font-family: var(--me-sans);
        }
        .me-reviews-cta-banner {
          margin-top: 56px;
          border-radius: 12px; overflow: hidden;
          position: relative; min-height: 240px;
          background: var(--me-dark);
          display: flex; align-items: center;
        }
        .me-reviews-cta-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, rgba(13,11,8,0.92) 0%, rgba(13,11,8,0.6) 100%);
        }
        .me-reviews-cta-content {
          position: relative; z-index: 2;
          padding: 48px 48px;
          max-width: 600px;
        }
        @media (max-width: 640px) { .me-reviews-cta-content { padding: 36px 24px; } }
        .me-reviews-cta-overline {
          font-size: 10px; font-weight: 700; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--me-gold);
          margin-bottom: 12px; font-family: var(--me-sans);
        }
        .me-reviews-cta-title {
          font-family: var(--me-serif); font-size: clamp(24px, 3.5vw, 38px);
          font-weight: 700; color: var(--me-text-cream);
          margin-bottom: 12px; line-height: 1.2;
        }
        .me-reviews-cta-sub {
          font-size: 14px; color: rgba(245,237,227,0.6);
          margin-bottom: 28px; line-height: 1.65;
          font-family: var(--me-sans);
        }
        .me-reviews-cta-badges {
          display: flex; gap: 24px; flex-wrap: wrap;
          margin-top: 20px;
        }
        .me-reviews-cta-badge {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          color: rgba(245,237,227,0.55); font-family: var(--me-sans);
        }
        .me-reviews-cta-badge svg { color: var(--me-gold); }

        /* ─── FAQ ─── */
        .me-faq { background: var(--me-ivory); padding: 30px 24px; }
        .me-faq-inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr;
          gap: 64px; align-items: start;
        }
        @media (min-width: 900px) {
          .me-faq-inner { grid-template-columns: 360px 1fr; }
        }
        .me-faq-left { position: relative; }
        .me-faq-img {
          width: 100%; height: 460px; object-fit: cover;
          border-radius: 8px; display: block;
          background: linear-gradient(135deg, #2a1e14, #1a1008);
        }
        .me-faq-img-placeholder {
          width: 100%; height: 460px; border-radius: 8px;
          background: linear-gradient(135deg, #2a1e14, #1a1008);
          display: flex; align-items: center; justify-content: center;
          font-size: 64px;
        }
        .me-faq-card {
          position: absolute; bottom: 24px; left: 20px; right: 20px;
          background: rgba(13,11,8,0.92);
          border: 1px solid rgba(196,151,63,0.2);
          border-radius: 8px; padding: 20px 22px;
        }
        .me-faq-card-icon { color: var(--me-gold); margin-bottom: 8px; }
        .me-faq-card-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--me-gold);
          margin-bottom: 8px; font-family: var(--me-sans);
        }
        .me-faq-card-text {
          font-size: 13px; color: rgba(245,237,227,0.55);
          line-height: 1.6; font-family: var(--me-sans);
        }
        .me-faq-right { }
        .me-faq-list { display: flex; flex-direction: column; gap: 0; margin-bottom: 28px; }
        .me-faq-item {
          border-bottom: 1px solid rgba(196,151,63,0.14);
          overflow: hidden;
        }
        .me-faq-item:first-child { border-top: 1px solid rgba(196,151,63,0.14); }
        .me-faq-trigger {
          width: 100%; background: none; border: none; cursor: pointer;
          padding: 22px 0; display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
          text-align: left;
        }
        .me-faq-num {
          font-size: 13px; font-weight: 700; color: var(--me-gold);
          font-family: var(--me-sans); flex-shrink: 0;
          width: 28px;
        }
        .me-faq-q {
          font-size: 15px; font-weight: 600; color: var(--me-text-dark);
          font-family: var(--me-sans); flex: 1;
          text-align: left;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .me-faq-icon {
          width: 26px; height: 26px; border-radius: 50%;
          border: 1.5px solid rgba(196,151,63,0.35);
          display: flex; align-items: center; justify-content: center;
          color: var(--me-gold); flex-shrink: 0;
          transition: background 0.18s;
          font-size: 16px; line-height: 1;
        }
        .me-faq-item.open .me-faq-icon { background: var(--me-gold); color: #fff; }
        .me-faq-answer {
          max-height: 0; overflow: hidden;
          transition: max-height 0.35s ease, padding 0.25s;
          padding: 0 0 0 28px;
        }
        .me-faq-item.open .me-faq-answer {
          max-height: 300px;
          padding: 0 0 22px 28px;
        }
        .me-faq-answer-text {
          font-size: 14px; line-height: 1.75;
          color: rgba(26,16,8,0.62); font-family: var(--me-sans);
        }
        .me-faq-more {
          display: flex; align-items: center; gap: 14px;
          background: var(--me-ivory);
          border: 1px solid rgba(196,151,63,0.2);
          border-radius: 8px; padding: 18px 22px;
          flex-wrap: wrap;
        }
        .me-faq-more-icon { color: var(--me-gold); font-size: 22px; flex-shrink: 0; }
        .me-faq-more-text { flex: 1; min-width: 140px; }
        .me-faq-more-title {
          font-size: 14px; font-weight: 700; color: var(--me-text-dark);
          font-family: var(--me-sans); margin-bottom: 2px;
        }
        .me-faq-more-sub {
          font-size: 12px; color: rgba(26,16,8,0.5);
          font-family: var(--me-sans);
        }

        /* ─── CONTACT ─── */
        .me-contact { background: var(--me-cream); padding: 30px 24px; }
        .me-contact-inner { max-width: 1100px; margin: 0 auto; }
        .me-contact-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 48px; margin-top: 52px;
        }
        @media (min-width: 900px) {
          .me-contact-grid { grid-template-columns: 1fr 1fr; align-items: start; }
        }
        .me-contact-info-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(196,151,63,0.12);
        }
        .me-contact-info-icon {
          width: 38px; height: 38px; border-radius: 50%;
          border: 1px solid rgba(196,151,63,0.25);
          display: flex; align-items: center; justify-content: center;
          color: var(--me-gold); flex-shrink: 0; font-size: 14px;
        }
        .me-contact-info-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(26,16,8,0.4);
          font-family: var(--me-sans); margin-bottom: 3px;
        }
        .me-contact-info-val {
          font-size: 15px; color: var(--me-text-dark);
          font-family: var(--me-sans); font-weight: 500;
          text-decoration: none;
          overflow-wrap: anywhere;
        }
        a.me-contact-info-val:hover { color: var(--me-gold); }
        .me-contact-info-val-sm {
          font-size: 13px; color: rgba(26,16,8,0.6);
          font-family: var(--me-sans);
        }
        .me-contact-map {
          border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(196,151,63,0.15);
          box-shadow: 0 8px 32px rgba(26,16,8,0.07);
        }
        .me-contact-studio-img {
          width: 100%; height: 220px; object-fit: cover;
          border-radius: 10px; display: block;
          margin-top: 16px;
        }
        .me-contact-studio-placeholder {
          width: 100%; height: 220px; border-radius: 10px;
          background: linear-gradient(135deg, #2a1e14, #1a1008);
          margin-top: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 48px;
        }
        .me-contact-cta { margin-top: 24px; }

        /* ─── BOOKING ─── */
        .me-booking { background: var(--me-ivory); padding: 30px 24px; }
        .me-booking-inner { max-width: 960px; margin: 0 auto; }

        /* ─── FOOTER ─── */
        .me-footer {
          background: var(--me-dark);
          padding: 64px 48px 32px;
        }
        @media (max-width: 640px) { .me-footer { padding: 48px 24px 24px; } }
        .me-footer-top {
          display: grid; grid-template-columns: 1fr;
          gap: 40px; margin-bottom: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(196,151,63,0.12);
        }
        @media (min-width: 768px) {
          .me-footer-top { grid-template-columns: 260px 1fr; }
        }
        .me-footer-brand-logo { height: 56px; width: auto; margin-bottom: 16px; display: block; }
        .me-footer-brand-name {
          font-family: var(--me-serif); font-size: 26px;
          font-weight: 600; color: var(--me-gold);
          margin-bottom: 8px;
        }
        .me-footer-brand-sub {
          font-size: 13px; color: rgba(245,237,227,0.4);
          line-height: 1.65; max-width: 220px;
          font-family: var(--me-sans); margin-bottom: 20px;
        }
        .me-footer-social { display: flex; gap: 12px; }
        .me-footer-social-btn {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(196,151,63,0.25);
          display: flex; align-items: center; justify-content: center;
          color: rgba(245,237,227,0.55); font-size: 13px;
          text-decoration: none; transition: border-color 0.18s, color 0.18s;
        }
        .me-footer-social-btn:hover { border-color: var(--me-gold); color: var(--me-gold); }
        .me-footer-cols {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .me-footer-cols > * { min-width: 0; }
        @media (max-width: 500px) {
          .me-footer-cols { grid-template-columns: 1fr; }
        }
        .me-footer-col-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--me-gold);
          margin-bottom: 16px; font-family: var(--me-sans);
        }
        .me-footer-col-link {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: rgba(245,237,227,0.5);
          text-decoration: none; margin-bottom: 10px;
          transition: color 0.15s; font-family: var(--me-sans);
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .me-footer-col-link:hover { color: var(--me-gold); }
        .me-footer-col-text {
          font-size: 13px; color: rgba(245,237,227,0.45);
          margin-bottom: 8px; line-height: 1.5;
          font-family: var(--me-sans);
          overflow-wrap: anywhere;
        }
        .me-footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        .me-footer-copy {
          font-size: 12px; color: rgba(245,237,227,0.28);
          font-family: var(--me-sans);
        }
        .me-footer-legal { display: flex; gap: 20px; }
        @media (max-width: 640px) { .me-footer-legal { flex-wrap: wrap; } }
        .me-footer-legal a {
          font-size: 12px; color: rgba(245,237,227,0.28);
          text-decoration: none; font-family: var(--me-sans);
          transition: color 0.15s;
        }
        .me-footer-legal a:hover { color: var(--me-gold); }
        .me-footer-top-btn {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(196,151,63,0.25);
          background: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: rgba(245,237,227,0.4); transition: border-color 0.18s, color 0.18s;
        }
        .me-footer-top-btn:hover { border-color: var(--me-gold); color: var(--me-gold); }

        /* ─── STICKY MOBILE CTA ─── */
        .me-sticky-cta {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          padding: 12px 20px;
          background: rgba(13,11,8,0.96);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(196,151,63,0.2);
          display: flex; gap: 12px;
        }
        @media (min-width: 768px) { .me-sticky-cta { display: none; } }
        .me-sticky-cta a {
          flex: 1; padding: 13px;
          text-align: center;
          font-size: 12px; font-weight: 700; letter-spacing: 0.16em;
          text-decoration: none; border-radius: 4px;
        }
        .me-sticky-cta a:first-child {
          background: var(--me-gold); color: #fff;
        }
        .me-sticky-cta a:last-child {
          border: 1px solid rgba(196,151,63,0.35); color: rgba(245,237,227,0.7);
        }

        /* ─── FADE REVEAL ─── */
        @keyframes me-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .me-fade { animation: me-fade-up 0.55s ease both; }
      `}</style>

      <div className="me-root" id="home">

        {/* ── NAV ── */}
        <nav className={`me-nav${scrolled ? " scrolled" : ""}`}>
          <a href="#home">
            {logoImg
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoImg} alt={tenant.salon_name} className="me-nav-logo" />
              : <span className="me-nav-name">{tenant.salon_name}</span>}
          </a>
          <div className="me-nav-links">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="me-nav-link">{l.label}</a>
            ))}
            <a href="#booking" className="me-nav-cta">ЗАПАЗИ ЧАС</a>
          </div>
          <button className="me-hamburger" onClick={() => setMobileOpen((v) => !v)} aria-label="Меню">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen
                ? <><line x1="4" y1="4" x2="18" y2="18"/><line x1="18" y1="4" x2="4" y2="18"/></>
                : <><line x1="2" y1="5" x2="20" y2="5"/><line x1="2" y1="11" x2="20" y2="11"/><line x1="2" y1="17" x2="20" y2="17"/></>}
            </svg>
          </button>
        </nav>
        <div className={`me-mobile-menu${mobileOpen ? " open" : ""}`}>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="me-mobile-link" onClick={() => setMobileOpen(false)}>{l.label}</a>
          ))}
          <a href="#booking" className="me-mobile-cta" onClick={() => setMobileOpen(false)}>ЗАПАЗИ ЧАС ОНЛАЙН</a>
        </div>

        {/* ── HERO ── */}
        <section className="me-hero">
          {heroImg && (
            <div className="me-hero-bg" style={{ backgroundImage: `url(${heroImg})` }} role="presentation" />
          )}
          <div className="me-hero-overlay" />
          <div className="me-hero-content">
            <p className="me-hero-overline">КРАСОТА, КОЯТО ГОВОРИ ЗА ТЕБ</p>
            <h1 className="me-hero-title">
              Поглед,<br />който остава.
            </h1>
            <p className="me-hero-sub">
              Микроблейдинг, мигли и перманентен грим с прецизност, стил и отношение.
            </p>
            <div className="me-hero-btns">
              <a href="#booking" className="me-btn-gold">
                ЗАПАЗИ ЧАС
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="7" x2="13" y2="7"/><polyline points="7,1 13,7 7,13"/></svg>
              </a>
              <a href="#results" className="me-btn-outline-cream">
                ВИЖ РЕЗУЛТАТИ
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="7" x2="13" y2="7"/><polyline points="7,1 13,7 7,13"/></svg>
              </a>
            </div>
          </div>
          <div className="me-hero-badges">
            {[
              { title: "СЕРТИФИЦИРАН АРТИСТ", sub: "Професионално обучение" },
              { title: "ПРЕМИУМ ПРОДУКТИ", sub: "Безопасни и сертифицирани" },
              { title: "5+ ГОДИНИ ОПИТ", sub: "Прецизност, на която можеш да се довериш" },
            ].map((b) => (
              <div key={b.title} className="me-hero-badge">
                <div className="me-badge-title">{b.title}</div>
                <div className="me-badge-sub">{b.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ABOUT / SPECIALIST ── */}
        <section id="about" className="me-about">
          <div className="me-about-inner">
            <div className="me-about-img-wrap">
              {aboutImg
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={aboutImg} alt="Мария Петрова" className="me-about-img" loading="lazy" />
                : <div className="me-about-img-placeholder" aria-hidden="true">🌿</div>}
            </div>
            <div>
              <p className="me-about-overline">ЗА СПЕЦИАЛИСТА</p>
              <h2 className="me-about-title">
                Прецизност, опит<br />и усет към детайла<span className="me-gold-dot">.</span>
              </h2>
              <p className="me-about-body">
                {tenant.about_text1 ?? "Казвам се Мария Петрова и вярвам, че красотата е в детайлите. Специализирам в микроблейдинг, мигли и перманентен грим, като съчетавам прецизност, естетика и индивидуален подход към всяка клиентка."}
              </p>
              <div className="me-about-stats">
                {[
                  { title: "СЕРТИФИЦИРАН АРТИСТ", sub: "Профес. обучение и международни сертификати." },
                  { title: "5+ ГОДИНИ ОПИТ", sub: "Хиляди доволни клиентки и непрекъснато усъвършенстване." },
                  { title: "PREMIUM ТЕХНИКИ И ПРОДУКТИ", sub: "Работя само с доказани, качествени и безопасни продукти." },
                ].map((s) => (
                  <div key={s.title} className="me-about-stat">
                    <div className="me-about-stat-title">{s.title}</div>
                    <div className="me-about-stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="me-about-quote">
                <span className="me-about-quote-mark">„</span>
                <p className="me-about-quote-text">
                  Всяка жена заслужава да се чувства уверена в своята кожа. Моята мисия е да подчертая естествената ти красота.
                </p>
                <div className="me-about-quote-sig">Мария Петрова ♡</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── RESULTS + GALLERY ── */}
        <section id="results" className="me-results">
          <div className="me-results-inner">
            <p className="me-section-label">РЕЗУЛТАТИ</p>
            <h2 className="me-section-title">Резултати, които говорят сами<span className="me-gold-dot">.</span></h2>
            <p className="me-section-sub">Подчертаваме естествената красота с внимание към всеки детайл.</p>

            <div className="me-ba-grid">
              {BEFORE_AFTER_IMGS.map((imgUrl, i) => (
                <div key={i} className="me-ba-card">
                  <div className="me-ba-visual">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt="преди и след" className="me-ba-img-full" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>

            <div className="me-results-cta-banner">
              <div className="me-results-cta-icon">📅</div>
              <div className="me-results-cta-text">
                <div className="me-results-cta-title">Готова си за своята трансформация?</div>
                <div className="me-results-cta-sub">Запази час и нека заедно подчертаем твоята красота.</div>
              </div>
              <a href="#booking" className="me-btn-gold">ЗАПАЗИ ЧАС →</a>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="me-services">
          <div className="me-services-inner">
            <div className="me-services-right">
              <p className="me-section-label">УСЛУГИ</p>
              <h2 className="me-section-title" style={{ marginBottom: 12 }}>
                Услуги, създадени за твоята естествена красота<span className="me-gold-dot">.</span>
              </h2>
              <p className="me-section-sub" style={{ marginBottom: 40 }}>
                Всяка процедура е персонализирана спрямо твоите черти и желания, за да подчертае естествената ти красота по най-добрия начин.
              </p>

              <div className="me-service-list">
                {HARDCODED_SERVICES.map((s, i) => (
                  <div key={s.id} className="me-service-item">
                    <div>
                      <div className="me-service-num">0{i + 1}</div>
                      <div className="me-service-name">{s.name}</div>
                      <div className="me-service-desc">{s.desc}</div>
                      <div className="me-service-meta">
                        <div className="me-service-meta-item">
                          <span className="me-service-meta-icon">⏱</span>
                          <span>{s.duration}</span>
                        </div>
                        <div className="me-service-meta-item">
                          <span className="me-service-meta-icon">📅</span>
                          <span>{s.durability}</span>
                        </div>
                      </div>
                    </div>
                    <div className="me-service-price-col">
                      <div className="me-service-price"><span>от</span>{s.price_eur} €</div>
                      <a href="#booking" className="me-btn-dark-sm">ЗАПАЗИ ЧАС →</a>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, color: "rgba(26,16,8,0.38)", marginTop: 16, fontFamily: "var(--me-sans)" }}>
                *Резултатите са индивидуални и зависят от типа кожа, начина на живот и правилната грижа.
              </p>
            </div>

            <div className="me-services-benefits">
              {[
                { title: "ПРЕМИУМ ПРОДУКТИ", sub: "Сертифицирани пигменти" },
                { title: "СТЕРИЛНА СРЕДА", sub: "100% хигиена и безопасност" },
                { title: "ИНДИВИДУАЛЕН ПОДХОД", sub: "Персонализиран план" },
                { title: "ДЪЛГОТРАЙНИ РЕЗУЛТАТИ", sub: "Естетични и устойчиви" },
                { title: "СЛЕДПРОЦЕДУРНА ГРИЖА", sub: "Подробни инструкции" },
              ].map((b) => (
                <div key={b.title} className="me-benefit">
                  <div className="me-benefit-title">{b.title}</div>
                  <div className="me-benefit-sub">{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section id="reviews" className="me-reviews">
          <div className="me-reviews-inner">
            <p className="me-section-label">ОТЗИВИ</p>
            <h2 className="me-section-title">Доверието на нашите клиентки<span className="me-gold-dot">.</span></h2>
            <p className="me-section-sub">Красотата е не само резултат. Тя е усещане.</p>

            <div className="me-reviews-grid">
              <div className="me-review-featured">
                <div className="me-review-card-main">
                  <span className="me-review-quote-mark">❝</span>
                  <p className="me-review-text">{TESTIMONIALS[reviewIdx].text}</p>
                  <div className="me-review-divider" />
                  <div style={{ marginBottom: 16 }}>
                    <div className="me-review-author-name">{TESTIMONIALS[reviewIdx].name}</div>
                    <div className="me-review-author-service">{TESTIMONIALS[reviewIdx].service}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="me-review-nav">
                      {TESTIMONIALS.map((_, i) => (
                        <button key={i} className={`me-review-dot${i === reviewIdx ? " active" : ""}`} onClick={() => setReviewIdx(i)} aria-label={`Отзив ${i + 1}`} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="me-review-arr" onClick={() => setReviewIdx((reviewIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} aria-label="Предишен">
                        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="7,1 1,7 7,13"/></svg>
                      </button>
                      <button className="me-review-arr" onClick={() => setReviewIdx((reviewIdx + 1) % TESTIMONIALS.length)} aria-label="Следващ">
                        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1,1 7,7 1,13"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="me-reviews-cta-banner">
              <div className="me-reviews-cta-overlay" />
              <div className="me-reviews-cta-content">
                <p className="me-reviews-cta-overline">ТВОЯТА КРАСОТА. НАШЕТО ИЗКУСТВО.</p>
                <h3 className="me-reviews-cta-title">Готова ли си за своята трансформация?</h3>
                <p className="me-reviews-cta-sub">Запази своя час онлайн и нека заедно подчертаем естествената ти красота.</p>
                <a href="#booking" className="me-btn-gold">📅 ЗАПАЗИ ЧАС ОНЛАЙН →</a>
                <div className="me-reviews-cta-badges">
                  {["ЛУКСОЗНА СРЕДА", "БЕЗОПАСНОСТ", "ИНДИВИДУАЛЕН ПОДХОД"].map((b) => (
                    <div key={b} className="me-reviews-cta-badge">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="2,7 5,10 12,3"/></svg>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="me-faq">
          <div className="me-faq-inner">
            <div className="me-faq-left">
              {aboutImg
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={aboutImg} alt="" className="me-faq-img" loading="lazy" />
                : <div className="me-faq-img-placeholder" aria-hidden="true">👁</div>}
              <div className="me-faq-card">
                <div className="me-faq-card-icon" style={{ fontSize: 20 }}>🌿</div>
                <div className="me-faq-card-title">ТВОЯТА КРАСОТА, НАШ ПРИОРИТЕТ</div>
                <div className="me-faq-card-text">Залагаме на прецизност, безопасност и индивидуален подход към всяка наша клиентка.</div>
              </div>
            </div>
            <div className="me-faq-right">
              <p className="me-section-label">ЧЗВ</p>
              <h2 className="me-about-title" style={{ marginBottom: 8 }}>Често задавани въпроси</h2>
              <p style={{ fontSize: 14, color: "rgba(26,16,8,0.5)", marginBottom: 32, fontFamily: "var(--me-sans)" }}>
                Всичко, което е важно да знаеш преди своята процедура.
              </p>
              <div className="me-faq-list">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className={`me-faq-item${faqOpen === i ? " open" : ""}`}>
                    <button className="me-faq-trigger" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                      <span className="me-faq-num">0{i + 1}</span>
                      <span className="me-faq-q">{item.q}</span>
                      <span className="me-faq-icon">{faqOpen === i ? "−" : "+"}</span>
                    </button>
                    <div className="me-faq-answer">
                      <p className="me-faq-answer-text">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="me-faq-more">
                <div className="me-faq-more-icon">💬</div>
                <div className="me-faq-more-text">
                  <div className="me-faq-more-title">Още въпроси?</div>
                  <div className="me-faq-more-sub">Свържи се с нас — ще се радваме да помогнем.</div>
                </div>
                <a href="#contact" className="me-btn-gold" style={{ padding: "10px 20px", fontSize: 11 }}>СВЪРЖИ СЕ С НАС →</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── BOOKING ── */}
        <section id="booking" className="me-booking">
          <div className="me-booking-inner">
            <p className="me-section-label">ОНЛАЙН РЕЗЕРВАЦИИ</p>
            <h2 className="me-section-title">Запазете своя час</h2>
            <p className="me-section-sub">Изберете услуга, дата и час — потвърждение пристига в рамките на минути.</p>
            <BookingCalendar
              salonSlug={tenant.salon_slug}
              salonName={tenant.salon_name}
              salonPhone={phone}
              salonAddress={address}
              salonGoogleMapsEmbed={tenant.google_maps_embed}
              services={services}
              workingHours={workingHours}
              isDemo={tenant.salon_slug.startsWith("demo/")}
            />
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" className="me-contact">
          <div className="me-contact-inner">
            <div style={{ textAlign: "center" }}>
              <p className="me-section-label">КОНТАКТИ</p>
                <h2 className="me-section-title">Свържи се с нас</h2>
              <p className="me-section-sub" style={{ marginBottom: 0 }}>и запази своя час онлайн.</p>
            </div>

            <div className="me-contact-grid">
              <div>
                {[
                  { icon: "📍", label: "АДРЕС", val: address, href: null },
                  { icon: "📞", label: "ТЕЛЕФОН", val: phone.replace(/(\+359)(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4"), href: `tel:${phone}` },
                  { icon: "✉", label: "ИМЕЙЛ", val: email, href: `mailto:${email}` },
                  { icon: "🕐", label: "РАБОТНО ВРЕМЕ", val: null, href: null },
                  { icon: "📷", label: "INSTAGRAM", val: instagramHandle, href: igHref ?? "#" },
                ].map((row) => (
                  <div key={row.label} className="me-contact-info-row">
                    <div className="me-contact-info-icon">{row.icon}</div>
                    <div>
                      <div className="me-contact-info-label">{row.label}</div>
                      {row.val && (
                        row.href
                          ? <a href={row.href} className="me-contact-info-val">{row.val}</a>
                          : <div className="me-contact-info-val">{row.val}</div>
                      )}
                      {row.label === "РАБОТНО ВРЕМЕ" && (
                        workingHours.length > 0
                          ? workingHours.filter((wh) => !wh.is_day_off).slice(0, 2).map((wh) => (
                              <div key={wh.id} className="me-contact-info-val-sm">
                                {DAY_LABELS[wh.day_of_week]}: {wh.start_time.slice(0,5)} – {wh.end_time.slice(0,5)}
                              </div>
                            ))
                          : <>
                              <div className="me-contact-info-val-sm">Понеделник – Петък: 10:00 – 19:00</div>
                              <div className="me-contact-info-val-sm">Събота: 10:00 – 16:00</div>
                              <div className="me-contact-info-val-sm">Неделя: Почивен ден</div>
                            </>
                      )}
                    </div>
                  </div>
                ))}
                <div className="me-contact-cta">
                  <a href="#booking" className="me-btn-gold">📅 ЗАПАЗИ ЧАС ОНЛАЙН →</a>
                </div>
              </div>

              <div>
                <div className="me-contact-map">
                  <iframe
                    src={mapsSrc}
                    width="100%" height="420"
                    style={{ border: 0, display: "block" }}
                    allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Карта"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="me-footer">
          <div className="me-footer-top">
            <div>
              {logoImg
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoImg} alt={tenant.salon_name} className="me-footer-brand-logo" />
                : <div className="me-footer-brand-name">{tenant.salon_name}</div>}
              <p className="me-footer-brand-sub">Микроблейдинг, мигли и перманентен грим с внимание към всеки детайл.</p>
              <div className="me-footer-social">
                {igHref && <a href={igHref} target="_blank" rel="noopener noreferrer" className="me-footer-social-btn" aria-label="Instagram">IG</a>}
                {fbHref && <a href={fbHref} target="_blank" rel="noopener noreferrer" className="me-footer-social-btn" aria-label="Facebook">FB</a>}
                {tkHref && <a href={tkHref} target="_blank" rel="noopener noreferrer" className="me-footer-social-btn" aria-label="TikTok">TK</a>}
              </div>
            </div>
            <div className="me-footer-cols">
              <div>
                <div className="me-footer-col-title">МЕНЮ</div>
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} className="me-footer-col-link">› {l.label.replace(/^[A-Z]+\s/, l.label)}</a>
                ))}
              </div>
              <div>
                <div className="me-footer-col-title">УСЛУГИ</div>
                {["Микроблейдинг вежди","Пудрови вежди","Мигли – класически","Мигли – обемни","Перманентен грим","Премахване с ремувер"].map((s) => (
                  <a key={s} href="#services" className="me-footer-col-link">› {s}</a>
                ))}
              </div>
              <div>
                <div className="me-footer-col-title">КОНТАКТИ</div>
                <div className="me-footer-col-text">{address}</div>
                <a href={`tel:${phone}`} className="me-footer-col-link">{phone}</a>
                <a href={`mailto:${email}`} className="me-footer-col-link">{email}</a>
                <div className="me-footer-col-text">{instagramHandle}</div>
              </div>
            </div>
          </div>
          <div className="me-footer-bottom">
            <div className="me-footer-copy">
              © 2026 Magnetic Eyes. Всички права запазени.
              <span style={{ margin: "0 8px", opacity: 0.3 }}>·</span>
              <a href="https://salonapp.pro" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", opacity: 0.4, textDecoration: "none", transition: "opacity 0.2s" }} onMouseEnter={e => (e.currentTarget.style.opacity="0.7")} onMouseLeave={e => (e.currentTarget.style.opacity="0.4")}>SalonApp.pro</a>
            </div>
            <div className="me-footer-legal">
              <a href="#">Политика за поверителност</a>
              <a href="#">Общи условия</a>
            </div>
            <button className="me-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Към началото">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1,8 6,2 11,8"/></svg>
            </button>
          </div>
        </footer>

        {/* ── STICKY MOBILE CTA ── */}
        <div className="me-sticky-cta">
          <a href="#booking">ЗАПАЗИ ЧАС</a>
          <a href={`tel:${phone}`}>ОБАДИ СЕ</a>
        </div>

      </div>
    </>
  );
}
