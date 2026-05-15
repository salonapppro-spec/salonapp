"use client";

import "./paw-empire.css";
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
  // First specialist with any content (bio or avatar), used for About section
  const soloSpec = specs.find((s) => s.bio || s.avatar_url) ?? null;
  const aboutImg = soloSpec
    ? (soloSpec.avatar_url?.trim() || tenant.about_image_url?.trim() || null)
    : (tenant.about_image_url?.trim() || null);
  const hasAbout = Boolean(
    (soloSpec?.bio) || (soloSpec?.avatar_url) ||
    tenant.about_text1 || tenant.about_text2 || tenant.about_image_url
  );

  const aboutTextRef = useFadeUp();
  const aboutImgRef = useFadeUp();
  const servicesHdrRef = useFadeUp();
  const galleryHdrRef = useFadeUp();

  return (
    <>

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
            {tenant.logo_url?.trim() && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={tenant.logo_url} alt={tenant.salon_name} className="pe-hero-logo-big" />
            )}
            <h1 className="pe-hero-title" style={{marginBottom:"1.6rem"}}>
              {tenant.hero_title || tenant.salon_name || "Твоят любимец"}
              <strong>{tenant.hero_subtitle || "заслужава лукс"}</strong>
            </h1>
            <p className="pe-hero-desc">
              {tenant.description ||
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
                ref={aboutTextRef}
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
                  ref={aboutImgRef}
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
          <div ref={servicesHdrRef} className="pe-services-hdr pe-fade-up">
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
          <div ref={galleryHdrRef} className="pe-gallery-hdr pe-fade-up">
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
