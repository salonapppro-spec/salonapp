"use client";

import { useState } from "react";
import type { SalonData, Service } from "@/types/database";
import {
  activeSpecialists,
  servicesFlatForPublic,
  servicesForSpecialist,
  useSpecialistSectionsOnPublicSite,
} from "@/components/templates/salon-shared";
import { BookingCalendar } from "@/components/templates/BookingCalendar";
import {
  safeFacebookHref,
  safeGoogleMapsEmbedSrc,
  safeInstagramHref,
  safeTiktokHref,
} from "@/lib/safe-public-urls";

const DAY_LABELS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"] as const;
const BGN_RATE = 1.956;
function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

// ─── Service card sub-component ──────────────────────────────────────────────

function ServiceCard({ s }: { s: Service }) {
  return (
    <div className="bloom-service-card">
      <div className="bloom-service-name">{s.name}</div>
      <div className="bloom-service-duration">
        {s.is_complex ? "Времето се уточнява" : `⏱ ${s.duration_minutes ?? 0} мин`}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "auto" }}>
        <span className="bloom-service-price">{Number(s.price_eur).toFixed(0)} €</span>
        <span className="bloom-service-bgn">≈ {eurToBgn(Number(s.price_eur))} лв</span>
      </div>
    </div>
  );
}

// ─── Euphoria site ────────────────────────────────────────────────────────────

export function EuphoriaSite({ data }: { data: SalonData }) {
  const { tenant, gallery } = data;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const rawTokens = (tenant.design_tokens ?? {}) as Record<string, unknown>;
  const bloomStats = (rawTokens.bloom_stats as Array<{ value: string; label: string }> | undefined) ?? [];
  const bloomPartnerLogos = (rawTokens.bloom_partner_logos as string[] | undefined) ?? [];

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  const tkHref = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);

  const heroTitle = tenant.hero_title ?? tenant.salon_name;
  const heroSubtitle = tenant.hero_subtitle ?? "";
  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const services = servicesFlatForPublic(data);

  const navLinks = [
    { label: "За нас",     href: "#about" },
    { label: "Услуги",     href: "#services" },
    { label: "Галерия",    href: "#gallery" },
    { label: "Резервация", href: "#booking" },
    { label: "Контакти",   href: "#contacts" },
  ];

  return (
    <>
      {/* ── Responsive styles via <style> tag — all colors use CSS vars ── */}
      <style>{`
        /* ───── BLOOM TEMPLATE ───── */

        .bloom-root {
          background-color: var(--color-bg);
          color: var(--color-text);
          font-family: var(--font-family);
          min-height: 100vh;
        }

        /* NAV */
        .bloom-nav {
          position: sticky; top: 0; z-index: 100;
          background: color-mix(in srgb, var(--color-bg) 88%, transparent);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
          padding: 0 24px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .bloom-nav-brand {
          font-family: var(--font-heading); font-size: 20px;
          font-weight: 700; color: var(--color-primary);
          text-decoration: none; white-space: nowrap;
        }
        .bloom-nav-logo { height: 40px; width: auto; display: block; }
        .bloom-nav-links {
          display: none; gap: 28px; align-items: center;
        }
        .bloom-nav-link {
          color: var(--color-text); opacity: 0.72; text-decoration: none;
          font-size: 14px; font-weight: 500; font-family: var(--font-nav);
          transition: opacity 0.15s;
        }
        .bloom-nav-link:hover { opacity: 1; }
        .bloom-nav-cta {
          display: inline-block;
          padding: 9px 20px;
          background: var(--color-primary); color: #fff;
          border-radius: var(--border-radius, 8px);
          text-decoration: none; font-size: 13px;
          font-family: var(--font-button); font-weight: 700;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .bloom-nav-cta:hover { opacity: 0.88; }
        .bloom-hamburger {
          background: none; border: none; cursor: pointer;
          padding: 8px; color: var(--color-text); line-height: 1;
        }
        .bloom-mobile-menu {
          display: none; flex-direction: column;
          background: var(--color-bg);
          border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
          padding: 12px 24px 20px; gap: 0;
        }
        .bloom-mobile-menu.open { display: flex; }
        .bloom-mobile-link {
          padding: 13px 4px; font-size: 16px; font-family: var(--font-nav);
          color: var(--color-text); text-decoration: none;
          border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
        }
        .bloom-mobile-cta {
          display: block; margin-top: 14px;
          padding: var(--button-padding, 14px 24px);
          background: var(--color-primary); color: #fff;
          border-radius: var(--border-radius, 8px);
          text-align: center; text-decoration: none;
          font-weight: 700; font-family: var(--font-button); font-size: 15px;
        }

        @media (min-width: 768px) {
          .bloom-nav-links { display: flex; }
          .bloom-hamburger { display: none; }
          .bloom-mobile-menu { display: none !important; }
        }

        /* HERO */
        .bloom-hero {
          position: relative; min-height: 92vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .bloom-hero-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
        }
        .bloom-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            155deg,
            color-mix(in srgb, var(--color-bg) 78%, transparent) 0%,
            color-mix(in srgb, var(--color-bg) 30%, transparent) 100%
          );
        }
        .bloom-hero-no-img .bloom-hero-overlay {
          background: color-mix(in srgb, var(--color-bg) 10%, transparent);
        }
        .bloom-hero-content {
          position: relative; z-index: 1;
          text-align: center; max-width: 740px;
          padding: 80px 24px;
        }
        .bloom-hero-badge {
          display: inline-block;
          padding: 5px 16px;
          border: 1px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
          border-radius: 9999px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.25em; text-transform: uppercase;
          color: var(--color-primary); margin-bottom: 22px;
          font-family: var(--font-nav);
        }
        .bloom-hero h1 {
          font-size: clamp(36px, 7vw, 72px);
          font-family: var(--font-heading); font-weight: 700;
          line-height: 1.08; color: var(--color-text);
          margin: 0 0 14px;
        }
        .bloom-hero h2 {
          font-size: clamp(22px, 4vw, 42px);
          font-family: var(--font-heading); font-weight: 400;
          line-height: 1.2; color: var(--color-primary);
          margin: 0 0 24px;
        }
        .bloom-hero-desc {
          font-size: 17px; font-family: var(--font-body);
          line-height: 1.78; color: var(--color-text);
          opacity: 0.7; margin-bottom: 40px;
          max-width: 560px; margin-left: auto; margin-right: auto;
        }
        .bloom-hero-btns {
          display: flex; flex-direction: column;
          gap: 12px; align-items: center;
        }
        @media (min-width: 480px) {
          .bloom-hero-btns { flex-direction: row; justify-content: center; }
        }
        .bloom-scroll-hint {
          position: absolute; bottom: 28px; left: 50%;
          transform: translateX(-50%); z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; opacity: 0.45; animation: bloom-bounce 2s infinite;
        }
        .bloom-scroll-hint span {
          font-size: 11px; font-family: var(--font-body);
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--color-text);
        }
        @keyframes bloom-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(5px); }
        }

        /* FEATURES STRIP */
        .bloom-features {
          display: grid; grid-template-columns: 1fr;
          border-top: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
          border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          gap: 1px;
        }
        @media (min-width: 640px) {
          .bloom-features { grid-template-columns: repeat(3, 1fr); }
        }
        .bloom-feature-item {
          padding: 28px 20px; background: var(--color-bg); text-align: center;
        }
        .bloom-feature-icon { font-size: 26px; margin-bottom: 10px; }
        .bloom-feature-title {
          font-size: 14px; font-weight: 700;
          color: var(--color-text); margin-bottom: 4px;
          font-family: var(--font-heading);
        }
        .bloom-feature-text {
          font-size: 13px; color: var(--color-text);
          opacity: 0.58; font-family: var(--font-body);
        }

        /* SECTION HEADER */
        .bloom-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--color-primary);
          text-align: center; margin-bottom: 10px;
          font-family: var(--font-nav);
        }
        .bloom-section-title {
          font-size: clamp(26px, 4vw, 40px);
          font-family: var(--font-heading); font-weight: 700;
          color: var(--color-text); text-align: center;
          margin: 0 0 10px; line-height: 1.2;
        }
        .bloom-section-sub {
          font-size: 15px; font-family: var(--font-body);
          color: var(--color-text); opacity: 0.55;
          text-align: center; margin-bottom: 48px;
        }

        /* ABOUT */
        .bloom-about {
          padding: var(--section-padding, 80px) 24px;
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
        }
        .bloom-about-inner {
          max-width: 1020px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr;
          gap: 48px; align-items: center;
        }
        @media (min-width: 768px) {
          .bloom-about-inner { grid-template-columns: 1fr 1fr; }
        }
        .bloom-about-img {
          width: 100%; height: 420px; object-fit: cover;
          object-position: top center;
          border-radius: var(--border-radius, 16px);
          display: block;
        }
        .bloom-about-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--color-primary);
          margin-bottom: 12px; font-family: var(--font-nav);
        }
        .bloom-about h2 {
          font-size: clamp(26px, 4vw, 38px);
          font-family: var(--font-heading); font-weight: 700;
          color: var(--color-text); margin: 0 0 20px; line-height: 1.2;
        }
        .bloom-about p {
          font-size: 16px; font-family: var(--font-body);
          line-height: 1.82; color: var(--color-text);
          opacity: 0.72; margin-bottom: 16px;
        }

        /* SERVICES */
        .bloom-services {
          padding: var(--section-padding, 80px) 24px;
          background: var(--color-bg);
        }
        .bloom-services-inner { max-width: 1060px; margin: 0 auto; }
        .bloom-services-grid {
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 480px) {
          .bloom-services-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .bloom-services-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .bloom-service-card {
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
          border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
          border-radius: var(--border-radius, 14px);
          padding: 24px 22px;
          display: flex; flex-direction: column; gap: 0;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: default;
        }
        .bloom-service-card:hover {
          box-shadow: 0 8px 32px color-mix(in srgb, var(--color-primary) 18%, transparent);
          transform: translateY(-3px);
        }
        .bloom-service-name {
          font-size: 16px; font-family: var(--font-heading);
          font-weight: 600; color: var(--color-text); margin-bottom: 8px;
        }
        .bloom-service-duration {
          font-size: 13px; font-family: var(--font-body);
          color: var(--color-text); opacity: 0.52; margin-bottom: 16px;
          flex: 1;
        }
        .bloom-service-price {
          font-size: 24px; font-weight: 700; color: var(--color-primary);
        }
        .bloom-service-bgn {
          font-size: 13px; color: var(--color-text); opacity: 0.45;
        }
        .bloom-specialist-title {
          font-size: 18px; font-family: var(--font-heading); font-weight: 700;
          color: var(--color-text); margin: 40px 0 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--color-primary);
        }

        /* GALLERY */
        .bloom-gallery {
          padding: var(--section-padding, 80px) 24px;
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
        }
        .bloom-gallery-inner { max-width: 1060px; margin: 0 auto; }
        .bloom-gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 640px) {
          .bloom-gallery-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        }
        @media (min-width: 900px) {
          .bloom-gallery-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .bloom-gallery-item {
          position: relative; overflow: hidden;
          border-radius: var(--border-radius, 12px);
          aspect-ratio: 1;
        }
        .bloom-gallery-item img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; transition: transform 0.45s ease;
        }
        .bloom-gallery-item:hover img { transform: scale(1.07); }

        /* TEAM / SPECIALISTS */
        .bloom-team {
          padding: var(--section-padding, 80px) 24px;
          background: var(--color-bg);
        }
        .bloom-team-inner { max-width: 1060px; margin: 0 auto; }
        .bloom-team-grid {
          display: grid; grid-template-columns: 1fr; gap: 28px;
        }
        @media (min-width: 560px) {
          .bloom-team-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .bloom-team-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .bloom-team-card {
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
          border: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
          border-radius: var(--border-radius, 16px);
          padding: 32px 24px 28px;
          text-align: center;
          transition: box-shadow 0.2s;
        }
        .bloom-team-card:hover {
          box-shadow: 0 8px 32px color-mix(in srgb, var(--color-primary) 16%, transparent);
        }
        .bloom-team-avatar {
          width: 96px; height: 96px; border-radius: 50%;
          object-fit: cover; display: block;
          margin: 0 auto 16px;
          border: 3px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
        }
        .bloom-team-avatar-placeholder {
          width: 96px; height: 96px; border-radius: 50%;
          background: color-mix(in srgb, var(--color-primary) 18%, transparent);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          font-size: 36px;
          border: 3px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
        }
        .bloom-team-name {
          font-size: 18px; font-family: var(--font-heading); font-weight: 700;
          color: var(--color-text); margin-bottom: 4px;
        }
        .bloom-team-role {
          font-size: 12px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--color-primary);
          margin-bottom: 14px; font-family: var(--font-nav);
        }
        .bloom-team-bio {
          font-size: 14px; font-family: var(--font-body);
          color: var(--color-text); opacity: 0.65;
          line-height: 1.72;
        }

        /* TEAM SINGLE — featured specialist layout */
        .bloom-team-single {
          display: flex; flex-direction: column-reverse;
          gap: 36px; align-items: center;
        }
        @media (min-width: 768px) {
          .bloom-team-single {
            flex-direction: row; align-items: flex-start; gap: 56px;
          }
        }
        .bloom-team-single-info { flex: 1; text-align: left; }
        .bloom-team-single-photo { width: 100%; max-width: 400px; flex-shrink: 0; }
        @media (min-width: 768px) {
          .bloom-team-single-photo { width: 380px; }
        }
        .bloom-team-single-img {
          width: 100%; height: 480px; object-fit: cover; object-position: top center;
          border-radius: var(--border-radius, 20px); display: block;
          border: 3px solid color-mix(in srgb, var(--color-primary) 28%, transparent);
          box-shadow: 0 12px 40px color-mix(in srgb, var(--color-primary) 12%, transparent);
        }
        .bloom-team-single-placeholder {
          width: 100%; height: 480px; border-radius: var(--border-radius, 20px);
          background: color-mix(in srgb, var(--color-primary) 12%, transparent);
          display: flex; align-items: center; justify-content: center;
          font-size: 80px;
        }
        .bloom-team-single-name {
          font-size: clamp(26px, 4vw, 38px); font-family: var(--font-heading); font-weight: 700;
          color: var(--color-text); margin-bottom: 6px; line-height: 1.15;
        }
        .bloom-team-single-role {
          font-size: 12px; font-weight: 700; letter-spacing: 0.25em;
          text-transform: uppercase; color: var(--color-primary);
          margin-bottom: 22px; font-family: var(--font-nav);
        }
        .bloom-team-single-bio {
          font-size: 15px; font-family: var(--font-body);
          color: var(--color-text); opacity: 0.72;
          line-height: 1.84; margin-bottom: 28px;
        }

        /* STATS STRIP */
        .bloom-stats-strip {
          display: grid; grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
          border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
          background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg));
          gap: 1px;
        }
        .bloom-stat-item {
          padding: 32px 16px; background: var(--color-bg); text-align: center;
        }
        .bloom-stat-value {
          display: block; font-size: clamp(32px, 5vw, 48px);
          font-family: var(--font-heading); font-weight: 700;
          color: var(--color-primary); line-height: 1;
          margin-bottom: 6px;
        }
        .bloom-stat-label {
          font-size: 13px; font-family: var(--font-body);
          color: var(--color-text); opacity: 0.55;
          text-transform: uppercase; letter-spacing: 0.1em;
        }

        /* PARTNER LOGOS */
        .bloom-partners {
          padding: var(--section-padding, 80px) 24px;
          background: color-mix(in srgb, var(--color-primary) 4%, var(--color-bg));
        }
        .bloom-partners-inner { max-width: 860px; margin: 0 auto; text-align: center; }
        .bloom-partners-title {
          font-size: 16px; font-family: var(--font-body);
          color: var(--color-text); opacity: 0.68; line-height: 1.7;
          margin-bottom: 36px; max-width: 560px; margin-left: auto; margin-right: auto;
        }
        .bloom-partners-logos {
          display: flex; align-items: center; justify-content: center;
          gap: 48px; flex-wrap: wrap;
        }
        .bloom-partner-logo {
          height: 52px; width: auto; max-width: 160px;
          object-fit: contain; display: block;
          filter: grayscale(1); opacity: 0.65;
          transition: filter 0.2s, opacity 0.2s;
        }
        .bloom-partner-logo:hover { filter: grayscale(0); opacity: 1; }
        @media (max-width: 480px) {
          .bloom-partners-logos { gap: 32px; }
          .bloom-partner-logo { height: 40px; }
        }

        /* GALLERY LIGHTBOX */
        .bloom-lightbox {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(0,0,0,0.92);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .bloom-lightbox-img {
          max-width: 90vw; max-height: 88vh;
          object-fit: contain; border-radius: 6px;
          display: block;
        }
        .bloom-lightbox-close {
          position: absolute; top: 16px; right: 20px;
          background: rgba(255,255,255,0.12); border: none; cursor: pointer;
          color: #fff; font-size: 22px; line-height: 1;
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .bloom-lightbox-close:hover { background: rgba(255,255,255,0.22); }
        .bloom-lightbox-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.12); border: none; cursor: pointer;
          color: #fff; font-size: 22px;
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .bloom-lightbox-arrow:hover { background: rgba(255,255,255,0.22); }
        .bloom-lightbox-arrow.prev { left: 16px; }
        .bloom-lightbox-arrow.next { right: 16px; }
        @media (max-width: 600px) {
          .bloom-lightbox-arrow.prev { left: 8px; }
          .bloom-lightbox-arrow.next { right: 8px; }
        }

        /* HERO LOGO BADGE */
        .bloom-hero-logo-img {
          height: 110px; width: auto; max-width: 280px;
          display: block; margin: 0 auto 24px;
          filter: drop-shadow(0 2px 12px rgba(0,0,0,0.22));
        }

        /* BOOKING */
        .bloom-booking {
          padding: var(--section-padding, 80px) 24px;
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
        }
        .bloom-booking-inner {
          max-width: 960px; margin: 0 auto;
        }

        /* CONTACTS */
        .bloom-contacts {
          padding: var(--section-padding, 80px) 24px;
          background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
        }
        .bloom-contacts-inner {
          max-width: 920px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr; gap: 44px;
        }
        @media (min-width: 768px) {
          .bloom-contacts-inner { grid-template-columns: 1fr 1fr; }
        }
        .bloom-contacts h3 {
          font-size: 20px; font-family: var(--font-heading); font-weight: 700;
          color: var(--color-text); margin-bottom: 20px;
        }
        .bloom-hours-row {
          display: flex; justify-content: space-between;
          padding: 11px 0;
          border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
          font-size: 15px; font-family: var(--font-body);
        }
        .bloom-hours-open { color: var(--color-primary); font-weight: 600; }
        .bloom-contact-row {
          display: flex; gap: 10px; align-items: flex-start;
          font-size: 15px; font-family: var(--font-body);
          color: var(--color-text); opacity: 0.72; margin-bottom: 12px;
        }
        .bloom-contact-link {
          color: var(--color-primary); text-decoration: none;
          opacity: 1;
        }
        .bloom-social { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
        .bloom-social-btn {
          padding: 8px 18px;
          border-radius: var(--border-radius, 8px);
          border: 1px solid color-mix(in srgb, var(--color-primary) 32%, transparent);
          background: var(--color-bg); color: var(--color-text);
          text-decoration: none; font-size: 13px; font-weight: 500;
          transition: background 0.18s;
        }
        .bloom-social-btn:hover {
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
        }
        .bloom-map {
          max-width: 920px; margin: 44px auto 0;
          border-radius: var(--border-radius, 16px);
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
        }

        /* FOOTER */
        .bloom-footer {
          padding: 44px 24px;
          background: var(--color-text);
          color: var(--color-bg);
          text-align: center;
        }
        .bloom-footer-name {
          font-size: 22px; font-family: var(--font-heading);
          font-weight: 700; margin-bottom: 8px;
          color: var(--color-bg);
        }
        .bloom-footer-copy {
          font-size: 13px; opacity: 0.5; margin-bottom: 6px;
        }
        .bloom-footer-powered { font-size: 12px; opacity: 0.35; }
        .bloom-footer-powered a { color: inherit; text-decoration: underline; }

        /* UTILITY BUTTONS */
        .bloom-btn-primary {
          display: inline-block;
          padding: var(--button-padding, 14px 36px);
          background: var(--color-primary); color: #fff;
          border-radius: var(--border-radius, 10px);
          text-decoration: none; font-size: 15px;
          font-family: var(--font-button); font-weight: 700;
          letter-spacing: 0.04em;
          transition: opacity 0.18s, transform 0.15s;
          white-space: nowrap;
        }
        .bloom-btn-primary:hover { opacity: 0.88; transform: translateY(-2px); }
        .bloom-btn-outline {
          display: inline-block;
          padding: var(--button-padding, 14px 36px);
          background: transparent; color: var(--color-text);
          border: 1.5px solid color-mix(in srgb, var(--color-text) 38%, transparent);
          border-radius: var(--border-radius, 10px);
          text-decoration: none; font-size: 15px;
          font-family: var(--font-button); font-weight: 600;
          transition: background 0.18s;
          white-space: nowrap;
        }
        .bloom-btn-outline:hover {
          background: color-mix(in srgb, var(--color-text) 8%, transparent);
        }
      `}</style>

      <div className="bloom-root">

        {/* ── NAVIGATION ── */}
        <nav className="bloom-nav">
          {/* Brand */}
          <div>
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.salon_name} className="bloom-nav-logo" />
            ) : (
              <span className="bloom-nav-brand">{tenant.salon_name}</span>
            )}
          </div>

          {/* Desktop links */}
          <div className="bloom-nav-links">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="bloom-nav-link">{l.label}</a>
            ))}
            <a href="#booking" className="bloom-nav-cta">Запази час</a>
          </div>

          {/* Hamburger */}
          <button className="bloom-hamburger" onClick={() => setMobileOpen((v) => !v)} aria-label="Меню">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="4" y1="4" x2="18" y2="18" />
                  <line x1="18" y1="4" x2="4" y2="18" />
                </>
              ) : (
                <>
                  <line x1="2" y1="5" x2="20" y2="5" />
                  <line x1="2" y1="11" x2="20" y2="11" />
                  <line x1="2" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile dropdown menu */}
        <div className={`bloom-mobile-menu${mobileOpen ? " open" : ""}`}>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="bloom-mobile-link" onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#booking" className="bloom-mobile-cta" onClick={() => setMobileOpen(false)}>Запази час онлайн</a>
        </div>

        {/* ── HERO ── */}
        <section className={`bloom-hero${!tenant.hero_image_url ? " bloom-hero-no-img" : ""}`}>
          {tenant.hero_image_url && (
            <div
              className="bloom-hero-bg"
              style={{ backgroundImage: `url(${tenant.hero_image_url})` }}
              role="presentation"
            />
          )}
          <div className="bloom-hero-overlay" />
          <div className="bloom-hero-content">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.salon_name} className="bloom-hero-logo-img" />
            ) : (
              <div className="bloom-hero-badge">{tenant.salon_name}</div>
            )}
            <h1>{heroTitle}</h1>
            {heroSubtitle && <h2>{heroSubtitle}</h2>}
            {tenant.description && (
              <p className="bloom-hero-desc">{tenant.description}</p>
            )}
            <div className="bloom-hero-btns">
              <a href="#booking" className="bloom-btn-primary">Запази час онлайн</a>
              <a href="#services" className="bloom-btn-outline">
                Разгледай услугите
              </a>
            </div>
          </div>
          <div className="bloom-scroll-hint" aria-hidden="true">
            <span>Разгледай</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="3,6 8,11 13,6" />
            </svg>
          </div>
        </section>

        {/* ── FEATURE STRIP ── */}
        <div className="bloom-features">
          {[
            { icon: "📅", title: "Онлайн записване", text: "Запазете час 24/7 от телефона" },
            { icon: "✨", title: "Персонализирани услуги", text: "Съобразени с вашите нужди" },
            { icon: "🌸", title: specs.length === 1 ? "Опитен специалист" : "Опитни специалисти", text: "Грижа, умение и внимание" },
          ].map(({ icon, title, text }) => (
            <div key={title} className="bloom-feature-item">
              <div className="bloom-feature-icon">{icon}</div>
              <div className="bloom-feature-title">{title}</div>
              <div className="bloom-feature-text">{text}</div>
            </div>
          ))}
        </div>

        {/* ── ABOUT / ЗА МЕН ── */}
        {specs.length === 1 && specs[0].bio ? (
          /* Solo specialist — personal "За мен" section */
          <section id="about" className="bloom-about">
            <div className="bloom-about-inner">
              {specs[0].avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={specs[0].avatar_url} alt={specs[0].name} className="bloom-about-img" loading="lazy" />
              ) : tenant.about_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.about_image_url} alt="За мен" className="bloom-about-img" loading="lazy" />
              ) : null}
              <div>
                <p className="bloom-about-label">За мен</p>
                <h2>{specs[0].name}</h2>
                {specs[0].role && (
                  <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "16px", fontFamily: "var(--font-nav)" }}>
                    {specs[0].role}
                  </p>
                )}
                <p>{specs[0].bio}</p>
                <a href="#booking" className="bloom-btn-primary" style={{ marginTop: "8px" }}>Запишете се сега</a>
              </div>
            </div>
          </section>
        ) : (tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) ? (
          /* Multi-specialist or no bio — standard about section */
          <section id="about" className="bloom-about">
            <div className="bloom-about-inner">
              {tenant.about_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.about_image_url} alt="За нас" className="bloom-about-img" loading="lazy" />
              )}
              <div>
                <p className="bloom-about-label">За нас</p>
                <h2>{tenant.salon_name}</h2>
                {tenant.about_text1 && <p>{tenant.about_text1}</p>}
                {tenant.about_text2 && <p>{tenant.about_text2}</p>}
                <a href="#booking" className="bloom-btn-primary" style={{ marginTop: "8px" }}>Запишете се сега</a>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── SERVICES ── */}
        <section id="services" className="bloom-services">
          <div className="bloom-services-inner">
            <p className="bloom-section-label">Нашите услуги</p>
            <h2 className="bloom-section-title">Услуги и цени</h2>
            <p className="bloom-section-sub">Всички цени са в EUR. BGN еквивалент при плащане в брой.</p>

            {multi ? (
              specs.map((sp) => {
                const list = servicesForSpecialist(data, sp.id);
                if (list.length === 0) return null;
                return (
                  <div key={sp.id}>
                    <h3 className="bloom-specialist-title">{sp.name}</h3>
                    <div className="bloom-services-grid">
                      {list.map((s) => <ServiceCard key={s.id} s={s} />)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bloom-services-grid">
                {services.length === 0 ? (
                  <p style={{ color: "var(--color-text)", opacity: 0.5 }}>Няма активни услуги.</p>
                ) : (
                  services.map((s) => <ServiceCard key={s.id} s={s} />)
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        {bloomStats.length > 0 && (
          <div className="bloom-stats-strip">
            {bloomStats.map((s) => (
              <div key={s.label} className="bloom-stat-item">
                <span className="bloom-stat-value">{s.value}</span>
                <span className="bloom-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── TEAM / SPECIALISTS — hidden for solo specialist (shown in About section) ── */}
        {specs.length > 1 && (
          <section id="team" className="bloom-team">
            <div className="bloom-team-inner">
              <p className="bloom-section-label">{specs.length === 1 ? "Вашият специалист" : "Нашият екип"}</p>
              <h2 className="bloom-section-title">{specs.length === 1 ? "Запознайте се с мен" : "Запознайте се с нас"}</h2>
              <p className="bloom-section-sub" style={{ marginBottom: "48px" }}>
                {specs.length === 1 ? "Отдадена на вашата красота и уют." : "Специалисти, отдадени на вашата красота и уют."}
              </p>

              {specs.length === 1 ? (
                /* Featured single-specialist layout */
                (() => {
                  const sp = specs[0];
                  return (
                    <div className="bloom-team-single">
                      {/* Info — left on desktop, bottom on mobile */}
                      <div className="bloom-team-single-info">
                        <div className="bloom-team-single-name">{sp.name}</div>
                        {sp.role && <div className="bloom-team-single-role">{sp.role}</div>}
                        {sp.bio && <p className="bloom-team-single-bio">{sp.bio}</p>}
                        <a href="#booking" className="bloom-btn-primary">Запази час</a>
                      </div>
                      {/* Photo — right on desktop, top on mobile */}
                      <div className="bloom-team-single-photo">
                        {sp.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sp.avatar_url} alt={sp.name} className="bloom-team-single-img" loading="lazy" />
                        ) : (
                          <div className="bloom-team-single-placeholder" aria-hidden="true">🌸</div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Multi-specialist grid */
                <div className="bloom-team-grid">
                  {specs.map((sp) => (
                    <div key={sp.id} className="bloom-team-card">
                      {sp.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sp.avatar_url} alt={sp.name} className="bloom-team-avatar" loading="lazy" />
                      ) : (
                        <div className="bloom-team-avatar-placeholder" aria-hidden="true">🌸</div>
                      )}
                      <div className="bloom-team-name">{sp.name}</div>
                      {sp.role && <div className="bloom-team-role">{sp.role}</div>}
                      {sp.bio && <p className="bloom-team-bio">{sp.bio}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── GALLERY ── */}
        {gallery.length > 0 && (
          <section id="gallery" className="bloom-gallery">
            <div className="bloom-gallery-inner">
              <p className="bloom-section-label">Нашата работа</p>
              <h2 className="bloom-section-title" style={{ marginBottom: "40px" }}>Галерия</h2>
              <div className="bloom-gallery-grid">
                {gallery.map((g, idx) => (
                  <div
                    key={g.id}
                    className="bloom-gallery-item"
                    onClick={() => setLightboxIdx(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt="" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── LIGHTBOX ── */}
        {lightboxIdx !== null && gallery.length > 0 && (
          <div className="bloom-lightbox" onClick={() => setLightboxIdx(null)}>
            <button
              className="bloom-lightbox-close"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
              aria-label="Затвори"
            >✕</button>
            <button
              className="bloom-lightbox-arrow prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + gallery.length) % gallery.length); }}
              aria-label="Предишна"
            >
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,1 1,9 9,17"/></svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[lightboxIdx].url}
              alt=""
              className="bloom-lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="bloom-lightbox-arrow next"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % gallery.length); }}
              aria-label="Следваща"
            >
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1,1 9,9 1,17"/></svg>
            </button>
          </div>
        )}

        {/* ── BOOKING ── */}
        <section id="booking" className="bloom-booking">
          <div className="bloom-booking-inner">
            <p className="bloom-section-label">Онлайн записване</p>
            <h2 className="bloom-section-title">Запазете своя час</h2>
            <p className="bloom-section-sub">
              Попълнете формата — потвърждение пристига в рамките на минути.
            </p>
            <BookingCalendar
              salonSlug={tenant.salon_slug}
              salonName={tenant.salon_name}
              salonPhone={tenant.phone}
              salonAddress={tenant.address}
              salonGoogleMapsEmbed={tenant.google_maps_embed}
              services={services}
              workingHours={data.workingHours}
              isDemo={tenant.salon_slug.startsWith("demo/")}
            />
          </div>
        </section>

        {/* ── PARTNER LOGOS ── */}
        {bloomPartnerLogos.length > 0 && (
          <div className="bloom-partners">
            <div className="bloom-partners-inner">
              <p className="bloom-section-label">Работим с</p>
              <p className="bloom-partners-title">
                Професионална грижа с най-добрите продукти от професионалните серии на:
              </p>
              <div className="bloom-partners-logos">
                {bloomPartnerLogos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="partner brand" className="bloom-partner-logo" loading="lazy" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTACTS + HOURS ── */}
        <section id="contacts" className="bloom-contacts">
          <div className="bloom-contacts-inner">
            {/* Working hours */}
            <div>
              <h3>Работно време</h3>
              {data.workingHours.map((wh) => (
                <div key={wh.id} className="bloom-hours-row">
                  <span>{DAY_LABELS[wh.day_of_week]}</span>
                  <span className="bloom-hours-open">
                    {wh.is_day_off ? "Почивен ден" : `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Contact details */}
            <div>
              <h3>Контакти</h3>
              {tenant.address && (
                <div className="bloom-contact-row">
                  <span>📍</span><span>{tenant.address}</span>
                </div>
              )}
              {tenant.phone && (
                <div className="bloom-contact-row">
                  <span>📞</span>
                  <a href={`tel:${tenant.phone}`} className="bloom-contact-link">{tenant.phone}</a>
                </div>
              )}
              {tenant.email && (
                <div className="bloom-contact-row">
                  <span>✉️</span>
                  <a href={`mailto:${tenant.email}`} className="bloom-contact-link">{tenant.email}</a>
                </div>
              )}
              <div className="bloom-social">
                {igHref && <a href={igHref} target="_blank" rel="noopener noreferrer" className="bloom-social-btn">Instagram</a>}
                {fbHref && <a href={fbHref} target="_blank" rel="noopener noreferrer" className="bloom-social-btn">Facebook</a>}
                {tkHref && <a href={tkHref} target="_blank" rel="noopener noreferrer" className="bloom-social-btn">TikTok</a>}
              </div>
            </div>
          </div>

          {/* Google Maps */}
          {mapsSrc && (
            <div className="bloom-map">
              <iframe
                src={mapsSrc}
                width="100%"
                height="400"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Карта"
              />
            </div>
          )}
        </section>

        {/* ── FOOTER ── */}
        <footer className="bloom-footer">
          <p className="bloom-footer-name">{tenant.salon_name}</p>
          <p className="bloom-footer-copy">© {new Date().getFullYear()} {tenant.salon_name}. Всички права запазени.</p>
          <p className="bloom-footer-powered">
            Powered by{" "}
            <a href="https://salonapp.pro" target="_blank" rel="noopener noreferrer">SalonApp.pro</a>
          </p>
        </footer>
      </div>
    </>
  );
}
