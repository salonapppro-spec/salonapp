"use client";

import { useState } from "react";
import type { SalonData } from "@/types/database";
import { BookingCalendar } from "@/components/templates/BookingCalendar";

// ─── Constants ────────────────────────────────────────────────────────────────
const BGN_RATE = 1.956;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtBgn(eur: number): string {
  return `${(eur * BGN_RATE).toFixed(2)} лв`;
}

/**
 * Извлича Google Maps embed URL от:
 * - Пълен <iframe ...> HTML (потребителят е копирал целия код)
 * - Само URL (очакваният формат)
 */
function extractMapsUrl(embed: string | null | undefined): string | null {
  if (!embed) return null;
  const trimmed = embed.trim();
  if (!trimmed) return null;
  // Ако е пълен iframe HTML — извлечи src="..."
  if (trimmed.startsWith("<iframe") || trimmed.startsWith("<IFRAME")) {
    const match = trimmed.match(/src="([^"]+)"/i);
    return match?.[1] ?? null;
  }
  return trimmed;
}

/**
 * Определя src URL за картата с приоритети:
 * 1. Правилен embed URL от admin (https://www.google.com/maps/embed?pb=...)
 * 2. Ако embed URL е зададен но е в лош формат — игнорира го
 * 3. Координати от design_tokens.maps_pin → генерира embed URL
 */
function resolveMapSrc(
  embed: string | null | undefined,
  tokens: unknown
): string | null {
  // Опит 1: embed URL само ако е правилният формат (/maps/embed)
  const url = extractMapsUrl(embed);
  if (url && url.includes("maps/embed")) return url;

  // Опит 2: координати от design_tokens.maps_pin
  if (tokens && typeof tokens === "object" && !Array.isArray(tokens)) {
    const t = tokens as Record<string, unknown>;
    const pin = t.maps_pin;
    if (pin && typeof pin === "object" && !Array.isArray(pin)) {
      const p = pin as Record<string, unknown>;
      const lat = typeof p.lat === "number" ? p.lat : null;
      const lng = typeof p.lng === "number" ? p.lng : null;
      if (lat !== null && lng !== null) {
        return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed&iwloc=near`;
      }
    }
  }

  // Опит 3: ако embed URL е зададен (дори лош формат), покажи него
  if (url) return url;

  return null;
}

function fmtDuration(min: number | null): string {
  if (!min) return "";
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.63-1.63a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function SocialIcon({ type }: { type: string }) {
  if (type === "ig") return <IgIcon />;
  if (type === "fb") return <FbIcon />;
  if (type === "tk") return <TkIcon />;
  return null;
}

// ─── Wave separator ───────────────────────────────────────────────────────────
function WaveDown({ topColor, bottomColor }: { topColor: string; bottomColor: string }) {
  return (
    <div style={{ background: topColor, lineHeight: 0, marginBottom: -1 }}>
      <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }} preserveAspectRatio="none">
        <path d="M0 0L60 10.7C120 21.3 240 42.7 360 48C480 53.3 600 42.7 720 32C840 21.3 960 10.7 1080 16C1200 21.3 1320 42.7 1380 53.3L1440 64V72H1380C1320 72 1200 72 1080 72C960 72 840 72 720 72C600 72 480 72 360 72C240 72 120 72 60 72H0V0Z" fill={bottomColor} />
      </svg>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
  .ln {
    --p: var(--color-primary, #B8788A);
    --p-dk: color-mix(in srgb, var(--p) 80%, #000 20%);
    --p-lt: color-mix(in srgb, var(--p) 12%, #FAF7F4 88%);
    --bg: #FAF7F4;
    --bg2: #F0E8E1;
    --bg-dark: #1A1108;
    --ink: #1A1108;
    --muted: #8B7A6A;
    --serif: 'Cormorant Garamond', 'Georgia', serif;
    --sans: 'DM Sans', system-ui, sans-serif;
    --script: 'Dancing Script', cursive;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--sans);
    overflow-x: hidden;
    min-height: 100svh;
  }

  /* ── Marquee ── */
  .ln-bar {
    background: var(--p);
    color: #fff;
    overflow: hidden;
    padding: 9px 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    white-space: nowrap;
    user-select: none;
  }
  .ln-bar-track {
    display: inline-flex;
    animation: ln-run 30s linear infinite;
    will-change: transform;
  }
  .ln-bar-chunk { display: inline-flex; align-items: center; padding-right: 0; }
  .ln-bar-sep { margin: 0 20px; opacity: 0.5; font-size: 9px; }
  @keyframes ln-run {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ── Header ── */
  .ln-header {
    position: sticky;
    top: 0;
    z-index: 200;
    background: rgba(250,247,244,0.93);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(26,17,8,0.07);
  }
  .ln-header-row {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 28px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .ln-logo { text-decoration: none; flex-shrink: 0; display: flex; align-items: center; }
  .ln-logo-img { height: 62px; width: auto; object-fit: contain; }
  .ln-logo-text {
    font-family: var(--script);
    font-size: 28px;
    color: var(--ink);
    line-height: 1;
    white-space: nowrap;
  }
  .ln-nav {
    display: none;
    gap: 36px;
    align-items: center;
  }
  @media (min-width: 980px) { .ln-nav { display: flex; } }
  .ln-nav a {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink);
    text-decoration: none;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  .ln-nav a:hover { opacity: 1; }
  .ln-header-end { display: flex; align-items: center; gap: 16px; }
  .ln-socials-header {
    display: none;
    gap: 14px;
    align-items: center;
  }
  @media (min-width: 700px) { .ln-socials-header { display: flex; } }
  .ln-socials-header a {
    color: var(--ink);
    opacity: 0.55;
    display: flex;
    transition: opacity 0.2s;
    text-decoration: none;
  }
  .ln-socials-header a:hover { opacity: 1; }

  /* ── Hamburger ── */
  .ln-burger {
    background: none; border: none; cursor: pointer;
    padding: 6px; display: flex; flex-direction: column; gap: 5px;
  }
  @media (min-width: 980px) { .ln-burger { display: none; } }
  .ln-bline {
    display: block; width: 22px; height: 1.5px;
    background: var(--ink); border-radius: 2px;
    transition: transform 0.25s, opacity 0.25s;
  }
  .ln-bline.o1 { transform: translateY(6.5px) rotate(45deg); }
  .ln-bline.o2 { opacity: 0; }
  .ln-bline.o3 { transform: translateY(-6.5px) rotate(-45deg); }
  .ln-mmenu {
    background: var(--bg);
    border-top: 1px solid rgba(26,17,8,0.07);
    padding: 8px 28px 28px;
  }
  .ln-mmenu a {
    display: block;
    padding: 15px 0;
    font-family: var(--serif);
    font-size: 22px;
    font-weight: 600;
    color: var(--ink);
    text-decoration: none;
    border-bottom: 1px solid rgba(26,17,8,0.06);
    letter-spacing: 0.01em;
  }
  .ln-mmenu-phone {
    display: block;
    margin-top: 20px;
    font-size: 15px;
    font-weight: 600;
    color: var(--p);
    text-decoration: none;
  }

  /* ── Buttons ── */
  .ln-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 26px;
    background: var(--p); color: #fff;
    font-size: 12px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    text-decoration: none; border: none; cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .ln-btn:hover { background: var(--p-dk); transform: translateY(-1px); }
  .ln-btn-lg { padding: 16px 36px; font-size: 13px; }
  .ln-btn-outline {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 26px;
    background: transparent; color: var(--ink);
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase;
    text-decoration: none;
    border: 1.5px solid rgba(26,17,8,0.22);
    transition: border-color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .ln-btn-outline:hover { border-color: var(--p); background: var(--p-lt); }
  .ln-btn-outline-light {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 26px;
    background: transparent; color: rgba(255,255,255,0.85);
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase;
    text-decoration: none;
    border: 1.5px solid rgba(255,255,255,0.3);
    transition: border-color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .ln-btn-outline-light:hover { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.08); }

  /* ── Hero ── */
  .ln-hero {
    display: grid;
    grid-template-columns: 1fr;
    min-height: 88svh;
  }
  @media (min-width: 900px) {
    .ln-hero { grid-template-columns: 55% 45%; min-height: 85svh; }
  }
  .ln-hero-media {
    position: relative;
    overflow: hidden;
    min-height: 52svh;
    background: var(--bg2);
  }
  @media (min-width: 900px) { .ln-hero-media { min-height: 0; } }
  .ln-hero-img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center top;
    display: block;
  }
  .ln-hero-shade {
    position: absolute; inset: 0;
    background: linear-gradient(160deg, transparent 55%, rgba(26,17,8,0.22) 100%);
  }
  @media (min-width: 900px) {
    .ln-hero-shade {
      background: linear-gradient(to right, transparent 70%, rgba(250,247,244,0.2) 100%);
    }
  }
  /* Floating accent badge on hero image */
  .ln-hero-badge {
    position: absolute;
    bottom: 28px; right: 28px;
    background: rgba(250,247,244,0.92);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 14px 20px;
    border-left: 2px solid var(--p);
    display: none;
  }
  @media (min-width: 900px) { .ln-hero-badge { display: block; } }
  .ln-hero-badge-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--muted);
    display: block; margin-bottom: 4px;
  }
  .ln-hero-badge-val {
    font-family: var(--serif); font-size: 22px;
    font-weight: 700; color: var(--ink); display: block;
  }

  .ln-hero-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 32px 72px;
    background: var(--bg);
  }
  @media (min-width: 900px) { .ln-hero-body { padding: 80px 72px 80px 64px; } }
  .ln-eyebrow {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--p); margin: 0 0 20px;
    display: flex; align-items: center; gap: 10px;
  }
  .ln-eyebrow::before {
    content: '';
    display: block; width: 28px; height: 1px;
    background: var(--p); flex-shrink: 0;
  }
  .ln-hero-title {
    font-family: var(--serif);
    font-size: clamp(48px, 7.5vw, 90px);
    font-weight: 700;
    line-height: 1.01;
    letter-spacing: -0.025em;
    color: var(--ink);
    margin: 0 0 24px;
  }
  .ln-hero-sub {
    font-size: 16px; line-height: 1.75;
    color: var(--muted); margin: 0 0 44px;
    max-width: 360px;
  }
  .ln-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }

  /* ── Quick tiles ── */
  .ln-tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid rgba(26,17,8,0.07);
    border-bottom: 1px solid rgba(26,17,8,0.07);
  }
  .ln-tile {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 5px; padding: 28px 12px;
    text-decoration: none;
    border-right: 1px solid rgba(26,17,8,0.07);
    background: var(--bg);
    transition: background 0.2s;
  }
  .ln-tile:last-child { border-right: none; }
  .ln-tile:hover { background: var(--bg2); }
  .ln-tile-cta { background: var(--p); }
  .ln-tile-cta:hover { background: var(--p-dk); }
  .ln-tile-sup {
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--muted);
  }
  .ln-tile-cta .ln-tile-sup { color: rgba(255,255,255,0.65); }
  .ln-tile-main {
    font-family: var(--serif);
    font-size: clamp(16px, 3.5vw, 22px);
    font-weight: 700; letter-spacing: -0.01em;
    color: var(--ink);
  }
  .ln-tile-cta .ln-tile-main { color: #fff; }
  @media (max-width: 460px) {
    .ln-tile { padding: 20px 8px; }
  }

  /* ── Section labels ── */
  .ln-tag {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--p); margin: 0 0 14px;
    display: block;
  }
  .ln-h2 {
    font-family: var(--serif);
    font-size: clamp(36px, 5vw, 62px);
    font-weight: 700; line-height: 1.04;
    letter-spacing: -0.022em;
    color: var(--ink); margin: 0 0 40px;
  }
  .ln-h2-light { color: #fff; }
  .ln-center { text-align: center; }

  /* ── About ── */
  .ln-about { background: var(--bg2); padding: 0 0 88px; }
  .ln-about-wrap {
    max-width: 1320px; margin: 0 auto;
    padding: 72px 32px 0;
    display: grid; grid-template-columns: 1fr;
    gap: 52px;
  }
  @media (min-width: 900px) {
    .ln-about-wrap {
      grid-template-columns: 1fr 1fr;
      gap: 80px; align-items: start;
      padding: 88px 64px 0;
    }
  }
  .ln-about-visual { position: relative; }
  .ln-about-img {
    width: 100%;
    aspect-ratio: 4/5;
    object-fit: cover; object-position: center top;
    display: block;
  }
  .ln-about-frame {
    position: absolute;
    top: -16px; right: -16px;
    width: 56%; aspect-ratio: 1;
    border: 1.5px solid var(--p);
    pointer-events: none;
    z-index: 0;
  }
  @media (max-width: 899px) {
    .ln-about-frame { top: -10px; right: -10px; }
  }
  .ln-about-decor {
    position: absolute;
    bottom: -16px; left: -16px;
    font-family: var(--serif);
    font-size: 120px; font-weight: 700;
    line-height: 1;
    color: var(--p);
    opacity: 0.08;
    pointer-events: none;
    user-select: none;
    letter-spacing: -0.04em;
  }
  .ln-about-text { }
  .ln-about-h {
    font-family: var(--serif);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 700; line-height: 1.12;
    letter-spacing: -0.015em;
    color: var(--ink); margin: 0 0 20px;
  }
  .ln-about-p {
    font-size: 16px; line-height: 1.78;
    color: var(--muted); margin: 0 0 32px;
  }
  /* Specialist card */
  .ln-specialist {
    display: flex; align-items: flex-start; gap: 18px;
    padding: 20px;
    background: rgba(250,247,244,0.7);
    border-left: 2px solid var(--p);
    margin: 0 0 32px;
  }
  .ln-specialist-ava {
    width: 60px; height: 60px;
    border-radius: 50%; object-fit: cover;
    flex-shrink: 0;
    border: 2px solid var(--p);
  }
  .ln-specialist-name {
    font-family: var(--serif);
    font-size: 20px; font-weight: 700;
    color: var(--ink); margin: 0 0 3px;
  }
  .ln-specialist-role {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--p); margin: 0 0 10px;
  }
  .ln-specialist-bio {
    font-size: 14px; line-height: 1.65;
    color: var(--muted); margin: 0;
  }

  /* ── Services ── */
  .ln-services { background: var(--bg); padding: 88px 0; }
  .ln-services-wrap {
    max-width: 820px; margin: 0 auto;
    padding: 0 32px;
  }
  .ln-svc-list { margin-top: 8px; }
  .ln-svc-row {
    display: flex; align-items: baseline; gap: 8px;
    padding: 18px 0;
    border-bottom: 1px solid rgba(26,17,8,0.07);
  }
  .ln-svc-row:first-child { border-top: 1px solid rgba(26,17,8,0.07); }
  .ln-svc-name-col { flex-shrink: 0; max-width: 52%; }
  .ln-svc-name {
    font-family: var(--serif);
    font-size: 19px; font-weight: 600;
    color: var(--ink); display: block;
    letter-spacing: -0.01em;
  }
  .ln-svc-dur {
    font-size: 12px; color: var(--muted);
    margin-top: 3px; display: block;
    letter-spacing: 0.04em;
  }
  .ln-svc-dots {
    flex: 1;
    border-bottom: 1px dotted rgba(26,17,8,0.18);
    margin-bottom: 4px;
  }
  .ln-svc-price-col { text-align: right; flex-shrink: 0; }
  .ln-svc-eur {
    font-family: var(--serif);
    font-size: 21px; font-weight: 700;
    color: var(--p); display: block;
  }
  .ln-svc-bgn {
    font-size: 12px; color: var(--muted);
    margin-top: 3px; display: block;
  }
  .ln-svc-footer { text-align: center; margin-top: 52px; }

  /* ── Gallery ── */
  .ln-gallery { background: var(--bg2); padding: 88px 0; }
  .ln-gallery-wrap {
    max-width: 1320px; margin: 0 auto;
    padding: 0 20px;
  }
  .ln-gallery-grid {
    columns: 2; column-gap: 10px;
    margin-top: 48px;
  }
  @media (min-width: 640px) { .ln-gallery-grid { columns: 3; column-gap: 12px; } }
  @media (min-width: 1024px) { .ln-gallery-grid { columns: 4; column-gap: 14px; } }
  .ln-gallery-item {
    break-inside: avoid;
    overflow: hidden;
    margin-bottom: 10px;
    position: relative;
  }
  @media (min-width: 640px) { .ln-gallery-item { margin-bottom: 12px; } }
  @media (min-width: 1024px) { .ln-gallery-item { margin-bottom: 14px; } }
  .ln-gallery-img {
    width: 100%; display: block;
    transition: transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ln-gallery-item:hover .ln-gallery-img { transform: scale(1.045); }
  .ln-gallery-veil {
    position: absolute; inset: 0;
    background: rgba(26,17,8,0);
    transition: background 0.35s;
  }
  .ln-gallery-item:hover .ln-gallery-veil { background: rgba(26,17,8,0.1); }

  /* ── Booking ── */
  .ln-booking { background: var(--bg-dark); padding: 88px 0 104px; }
  .ln-booking-wrap {
    max-width: 980px; margin: 0 auto;
    padding: 0 24px;
  }
  .ln-booking-head { text-align: center; margin-bottom: 52px; }
  .ln-booking-tag {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--p); margin: 0 0 16px; display: block;
  }
  .ln-booking-phone-hint {
    font-size: 14px; color: rgba(255,255,255,0.4);
    margin: -28px 0 0;
  }
  .ln-booking-phone-hint a {
    color: rgba(255,255,255,0.65);
    text-decoration: none;
    transition: color 0.2s;
  }
  .ln-booking-phone-hint a:hover { color: #fff; }
  .ln-booking-cal-wrap {
    background: #FAF7F4;
    border-radius: 4px;
    overflow: hidden;
  }

  /* ── Contact ── */
  .ln-contact { background: var(--bg); padding: 52px 0 88px; }
  .ln-contact-wrap {
    max-width: 1320px; margin: 0 auto;
    padding: 0 32px;
    display: grid; grid-template-columns: 1fr;
    gap: 52px;
  }
  @media (min-width: 900px) {
    .ln-contact-wrap {
      grid-template-columns: 1fr 1fr;
      gap: 80px; align-items: start;
    }
  }
  .ln-contact-logo {
    height: clamp(140px, 20vw, 220px); width: auto; object-fit: contain;
    display: block; margin-bottom: 16px;
  }
  .ln-contact-row {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 15px; color: var(--ink);
    margin-bottom: 18px;
  }
  .ln-contact-row a { color: inherit; text-decoration: none; transition: color 0.2s; }
  .ln-contact-row a:hover { color: var(--p); }
  .ln-contact-socials { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 32px; }
  .ln-soc-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 18px;
    border: 1.5px solid rgba(26,17,8,0.14);
    color: var(--ink); text-decoration: none;
    font-size: 13px; font-weight: 500;
    transition: border-color 0.2s, background 0.2s;
  }
  .ln-soc-btn:hover { border-color: var(--p); background: var(--p-lt); }
  .ln-soc-btn-inactive {
    opacity: 0.35; pointer-events: none; cursor: default;
  }
  .ln-map-frame {
    width: 100%; height: 380px;
    border: none; display: block;
  }
  .ln-map-placeholder {
    width: 100%; height: 380px;
    background: var(--bg2);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 16px; text-align: center;
    padding: 32px;
  }
  .ln-map-placeholder-icon { opacity: 0.25; }
  .ln-map-placeholder-addr {
    font-size: 15px; color: var(--muted);
    max-width: 280px; line-height: 1.6;
  }

  /* ── Footer ── */
  .ln-footer {
    background: var(--bg-dark);
    padding: 22px 32px;
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .ln-footer-txt {
    font-size: 13px; color: rgba(255,255,255,0.28);
    margin: 0;
  }
  .ln-footer-txt a { color: rgba(255,255,255,0.45); text-decoration: none; }
  .ln-footer-txt a:hover { color: rgba(255,255,255,0.75); }
  .ln-footer-cookie {
    background: none; border: none; cursor: pointer; padding: 0;
    color: rgba(255,255,255,0.28); font-size: 13px;
    text-decoration: underline; text-underline-offset: 3px;
    transition: color 0.2s; font-family: inherit;
  }
  .ln-footer-cookie:hover { color: rgba(255,255,255,0.6); }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export function LindySite({ data }: { data: SalonData }) {
  const { tenant, services, gallery, workingHours, specialists } = data;
  const [open, setOpen] = useState(false);

  const activeServices   = services.filter((s) => s.is_active);
  const activeSpecialists = (specialists ?? []).filter((s) => s.is_active);
  const galleryImages    = gallery.slice(0, 12);

  const heroImg  = tenant.hero_image_url?.trim() || gallery[0]?.url || "";
  const aboutImg = tenant.about_image_url?.trim() || gallery[1]?.url || gallery[0]?.url || "";
  const mapSrc   = resolveMapSrc(tenant.google_maps_embed, tenant.design_tokens);

  const socials = [
    tenant.instagram_url ? { href: tenant.instagram_url, label: "Instagram", type: "ig" } : null,
    tenant.facebook_url  ? { href: tenant.facebook_url,  label: "Facebook",  type: "fb" } : null,
    tenant.tiktok_url    ? { href: tenant.tiktok_url,    label: "TikTok",    type: "tk" } : null,
  ].filter(Boolean) as { href: string; label: string; type: string }[];

  const nav = [
    { href: "#about",   label: "За нас"     },
    { href: "#services",label: "Услуги"     },
    { href: "#gallery", label: "Галерия"    },
    { href: "#booking", label: "Резервирай" },
    { href: "#contact", label: "Контакти"   },
  ];

  /* Marquee content — repeated ×2 for seamless loop */
  const marqueeItems = [
    tenant.salon_name,
    "Луксозен маникюр",
    "Резервирай онлайн",
    "Красотата е в детайла",
    "Nail Studio",
    tenant.salon_name,
    "Луксозен маникюр",
    "Резервирай онлайн",
    "Красотата е в детайла",
    "Nail Studio",
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="ln">

        {/* ══ Marquee bar ══════════════════════════════════════════════════════ */}
        <div className="ln-bar" aria-hidden="true">
          <div className="ln-bar-track">
            {[0, 1].map((rep) => (
              <span key={rep} className="ln-bar-chunk">
                {marqueeItems.map((item, i) => (
                  <span key={i}>
                    {item}
                    <span className="ln-bar-sep">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ══ Header ═══════════════════════════════════════════════════════════ */}
        <header className="ln-header">
          <div className="ln-header-row">
            {/* Logo */}
            <a href="#top" className="ln-logo">
              {tenant.logo_url?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logo_url} alt={tenant.salon_name} className="ln-logo-img" />
              ) : (
                <span className="ln-logo-text">{tenant.salon_name}</span>
              )}
            </a>

            {/* Desktop nav */}
            <nav className="ln-nav" aria-label="Навигация">
              {nav.map((l) => (
                <a key={l.href} href={l.href}>{l.label}</a>
              ))}
            </nav>

            {/* Right: socials + CTA + burger */}
            <div className="ln-header-end">
              {socials.length > 0 && (
                <div className="ln-socials-header">
                  {socials.map((s) => (
                    <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                      <SocialIcon type={s.type} />
                    </a>
                  ))}
                </div>
              )}
              <a href="#booking" className="ln-btn" style={{ display: "none" }} aria-hidden="true" />
              {/* Desktop book CTA */}
              <a href="#booking" className="ln-btn" style={{ fontSize: 12, padding: "10px 20px", letterSpacing: "0.12em" }}>
                Резервирай
              </a>
              {/* Burger */}
              <button className="ln-burger" onClick={() => setOpen((v) => !v)} aria-label="Меню" aria-expanded={open}>
                <span className={`ln-bline${open ? " o1" : ""}`} />
                <span className={`ln-bline${open ? " o2" : ""}`} />
                <span className={`ln-bline${open ? " o3" : ""}`} />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {open && (
            <div className="ln-mmenu">
              {nav.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
              ))}
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="ln-mmenu-phone">
                  <PhoneIcon size={14} /> {tenant.phone}
                </a>
              )}
            </div>
          )}
        </header>

        {/* ══ Hero ═════════════════════════════════════════════════════════════ */}
        <section className="ln-hero" id="top">
          {/* Left — image */}
          <div className="ln-hero-media">
            {heroImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImg}
                alt={tenant.salon_name}
                className="ln-hero-img"
                fetchPriority="high"
                decoding="async"
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--bg2)" }} />
            )}
            <div className="ln-hero-shade" />
            {/* Floating badge */}
            <div className="ln-hero-badge">
              <span className="ln-hero-badge-label">Запази час</span>
              <span className="ln-hero-badge-val">Онлайн ✦</span>
            </div>
          </div>

          {/* Right — content */}
          <div className="ln-hero-body">
            <p className="ln-eyebrow">Nail Studio</p>
            <h1 className="ln-hero-title">
              {tenant.hero_title || "Перфекцията е в детайла"}
            </h1>
            {tenant.hero_subtitle && (
              <p className="ln-hero-sub">{tenant.hero_subtitle}</p>
            )}
            <div className="ln-hero-actions">
              <a href="#booking" className="ln-btn ln-btn-lg">
                <PhoneIcon size={15} />
                Резервирай час
              </a>
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="ln-btn-outline ln-btn-lg">
                  {tenant.phone}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ══ Quick tiles ══════════════════════════════════════════════════════ */}
        <div className="ln-tiles">
          <a href="#services" className="ln-tile">
            <span className="ln-tile-sup">Разгледай</span>
            <span className="ln-tile-main">Услугите</span>
          </a>
          <a href="#gallery" className="ln-tile">
            <span className="ln-tile-sup">Виж</span>
            <span className="ln-tile-main">Галерията</span>
          </a>
          <a href="#booking" className="ln-tile ln-tile-cta">
            <span className="ln-tile-sup">Запази</span>
            <span className="ln-tile-main">Час →</span>
          </a>
        </div>

        {/* ══ About ════════════════════════════════════════════════════════════ */}
        <section id="about">
          <WaveDown topColor="var(--bg, #FAF7F4)" bottomColor="var(--bg2, #F0E8E1)" />
          <div className="ln-about">
            <div className="ln-about-wrap">

              {/* Visual */}
              {aboutImg && (
                <div className="ln-about-visual">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aboutImg}
                    alt="За нас"
                    className="ln-about-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="ln-about-frame" aria-hidden="true" />
                  <div className="ln-about-decor" aria-hidden="true">L</div>
                </div>
              )}

              {/* Text */}
              <div className="ln-about-text">
                <span className="ln-tag">За нас</span>
                <h2 className="ln-about-h">
                  {tenant.about_text1 || `Добре дошли в ${tenant.salon_name}`}
                </h2>
                {tenant.about_text2 && (
                  <p className="ln-about-p">{tenant.about_text2}</p>
                )}

                {/* Specialists */}
                {activeSpecialists.map((sp) => (
                  <div key={sp.id} className="ln-specialist">
                    {sp.avatar_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sp.avatar_url}
                        alt={sp.name}
                        className="ln-specialist-ava"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div>
                      <p className="ln-specialist-name">{sp.name}</p>
                      {sp.role && <p className="ln-specialist-role">{sp.role}</p>}
                      {sp.bio && <p className="ln-specialist-bio">{sp.bio}</p>}
                    </div>
                  </div>
                ))}

                <a href="#booking" className="ln-btn">Запази час →</a>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Services ═════════════════════════════════════════════════════════ */}
        {activeServices.length > 0 && (
          <section id="services">
            <WaveDown topColor="var(--bg2, #F0E8E1)" bottomColor="var(--bg, #FAF7F4)" />
            <div className="ln-services">
              <div className="ln-services-wrap">
                <span className="ln-tag">Ценова листа</span>
                <h2 className="ln-h2">Услуги</h2>
                <div className="ln-svc-list">
                  {activeServices.map((s) => (
                    <div key={s.id} className="ln-svc-row">
                      <div className="ln-svc-name-col">
                        <span className="ln-svc-name">{s.name}</span>
                        {s.duration_minutes && (
                          <span className="ln-svc-dur">⏱ {fmtDuration(s.duration_minutes)}</span>
                        )}
                      </div>
                      <div className="ln-svc-dots" aria-hidden="true" />
                      <div className="ln-svc-price-col">
                        <span className="ln-svc-eur">{Math.round(s.price_eur)} €</span>
                        <span className="ln-svc-bgn">{fmtBgn(s.price_eur)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ln-svc-footer">
                  <a href="#booking" className="ln-btn">Резервирай →</a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══ Gallery ══════════════════════════════════════════════════════════ */}
        {galleryImages.length > 0 && (
          <section id="gallery">
            <WaveDown topColor="var(--bg, #FAF7F4)" bottomColor="var(--bg2, #F0E8E1)" />
            <div className="ln-gallery">
              <div className="ln-gallery-wrap">
                <div className="ln-center">
                  <span className="ln-tag">Вдъхновение</span>
                  <h2 className="ln-h2 ln-center">Галерия</h2>
                </div>
                <div className="ln-gallery-grid">
                  {galleryImages.map((img, i) => (
                    <div key={img.id} className="ln-gallery-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`${tenant.salon_name} — ${i + 1}`}
                        className="ln-gallery-img"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="ln-gallery-veil" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══ Booking ══════════════════════════════════════════════════════════ */}
        <section id="booking">
          <WaveDown topColor="var(--bg2, #F0E8E1)" bottomColor="var(--bg-dark, #1A1108)" />
          <div className="ln-booking">
            <div className="ln-booking-wrap">
              <div className="ln-booking-head">
                <span className="ln-booking-tag">Онлайн резервация</span>
                <h2 className="ln-h2 ln-h2-light ln-center">Запази своя час</h2>
                {tenant.phone && (
                  <p className="ln-booking-phone-hint">
                    или се обади на{" "}
                    <a href={`tel:${tenant.phone}`}>{tenant.phone}</a>
                  </p>
                )}
              </div>
              <div className="ln-booking-cal-wrap">
                <BookingCalendar
                  salonSlug={tenant.salon_slug}
                  salonName={tenant.salon_name}
                  salonPhone={tenant.phone ?? undefined}
                  salonAddress={tenant.address ?? undefined}
                  salonGoogleMapsEmbed={mapSrc ?? undefined}
                  services={services}
                  workingHours={workingHours}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══ Contact ══════════════════════════════════════════════════════════ */}
        <section id="contact">
          <WaveDown topColor="var(--bg-dark, #1A1108)" bottomColor="var(--bg, #FAF7F4)" />
          <div className="ln-contact">
            <div className="ln-contact-wrap">

              {/* Info */}
              <div>
                {/* Лого в контактната секция */}
                {tenant.logo_url?.trim() && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logo_url}
                    alt={tenant.salon_name}
                    className="ln-contact-logo"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span className="ln-tag">Контакти</span>
                {tenant.address && (
                  <div className="ln-contact-row">
                    <PinIcon />
                    <span>{tenant.address}</span>
                  </div>
                )}
                {tenant.phone && (
                  <div className="ln-contact-row">
                    <PhoneIcon size={16} />
                    <a href={`tel:${tenant.phone}`}>{tenant.phone}</a>
                  </div>
                )}
                {tenant.email && (
                  <div className="ln-contact-row">
                    <MailIcon />
                    <a href={`mailto:${tenant.email}`}>{tenant.email}</a>
                  </div>
                )}
                {/* Социалните мрежи — винаги показани; неактивни ако URL липсва */}
                <div className="ln-contact-socials">
                  {[
                    { href: tenant.instagram_url, label: "Instagram", type: "ig" },
                    { href: tenant.facebook_url,  label: "Facebook",  type: "fb" },
                    { href: tenant.tiktok_url,    label: "TikTok",    type: "tk" },
                  ].map((s) =>
                    s.href ? (
                      <a key={s.type} href={s.href} target="_blank" rel="noopener noreferrer" className="ln-soc-btn">
                        <SocialIcon type={s.type} />
                        <span>{s.label}</span>
                      </a>
                    ) : (
                      <span key={s.type} className="ln-soc-btn ln-soc-btn-inactive" aria-hidden="true">
                        <SocialIcon type={s.type} />
                        <span>{s.label}</span>
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Map — iframe от embed URL или от координати, иначе placeholder */}
              <div>
                {mapSrc ? (
                  <iframe
                    src={mapSrc}
                    title="Карта"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="ln-map-frame"
                  />
                ) : (
                  <div className="ln-map-placeholder">
                    <div className="ln-map-placeholder-icon">
                      <PinIcon />
                    </div>
                    {tenant.address && (
                      <p className="ln-map-placeholder-addr">{tenant.address}</p>
                    )}
                    {tenant.address && (
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(tenant.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ln-btn-outline"
                      >
                        Виж в Google Maps →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ══ Footer ═══════════════════════════════════════════════════════════ */}
        <footer className="ln-footer">
          <p className="ln-footer-txt">
            © {new Date().getFullYear()} {tenant.salon_name}
            {" · "}
            <a href="https://salonapp.pro" target="_blank" rel="noopener noreferrer">
              SalonApp.pro
            </a>
            {" · "}
            <button
              type="button"
              className="ln-footer-cookie"
              onClick={() => {
                try { localStorage.removeItem("salonapp_cookie_consent"); } catch {}
                window.location.reload();
              }}
            >
              Бисквитки
            </button>
          </p>
        </footer>

      </div>
    </>
  );
}
