"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { SalonData, Service } from "@/types/database";
import { servicesFlatForPublic } from "@/components/templates/salon-shared";
import { BookingFlow } from "@/components/booking/BookingFlow";
import {
  safeFacebookHref,
  safeGoogleMapsEmbedSrc,
  safeTiktokHref,
} from "@/lib/safe-public-urls";

/* ────────────────────────────────────────────────────────────────
   ATS Studio — Александър Цолов · Терапевтичен масаж, Бургас
   Уникален премиум терапевтичен сайт (не СПА естетика).
   Палитра от брифа: Midnight #0F2343 · Gold #C8A45A · Ivory #F8F5EF
   · Graphite #2E2E2E · Sage #879A83
   Данни (снимки/услуги/график/контакти) идват от базата (SalonData).
   ──────────────────────────────────────────────────────────────── */

const BGN = 1.956;
const DAY_BG = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;

const FALLBACK_PHONE = "0988 326 239";
const FALLBACK_ADDRESS = "ул. Дебелт 14, Бургас";

function eur(v: number) {
  return `${Number(v).toFixed(0)} €`;
}
function bgn(v: number) {
  return `${(Number(v) * BGN).toFixed(2)} лв`;
}
function fmtDuration(min: number | null): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.v = "1";
          io.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* Състояния, при които терапевтичният масаж помага — SEO-богата секция. */
const CONDITIONS: { title: string; text: string }[] = [
  {
    title: "Плексит",
    text: "Възпаление на нервния сплит в рамото с болка и изтръпване. Прилагам щадящи техники за облекчаване на напрежението около раменния пояс и възстановяване на подвижността.",
  },
  {
    title: "Ишиас",
    text: "Болка по хода на седалищния нерв, която слиза към крака. Работя върху мускулатурата на кръста и таза, за да намаля притискането и да облекча острата симптоматика.",
  },
  {
    title: "Дискова херния",
    text: "При дискова херния масажът отпуска околната мускулатура, подобрява кръвообращението и намалява защитния мускулен спазъм около засегнатия сегмент.",
  },
  {
    title: "Болки в кръста",
    text: "Хроничното напрежение и претоварване в кръста реагира добре на дълбокотъканни и лечебни техники, които възстановяват мекотата на мускулите.",
  },
  {
    title: "Болки във врата и схванат врат",
    text: "Заседналата работа и стресът водят до скованост във врата. Освобождавам напрегнатата мускулатура и връщам свободата на движението.",
  },
  {
    title: "Болки в гърба",
    text: "Комбинирам класически и дълбокотъканен масаж, за да облекча болката, да отпусна мускулните вериги и да подобря стойката.",
  },
  {
    title: "Главоболие от напрежение",
    text: "Голяма част от главоболията тръгват от напрегнати мускули във врата и раменете. Работата върху тях често носи трайно облекчение.",
  },
  {
    title: "Мускулни спазми и скованост",
    text: "Локалните спазми и сковаността в раменете ограничават ежедневието. Целенасочените техники ги разпускат и връщат подвижността.",
  },
  {
    title: "Лимфен застой и отоци",
    text: "Ръчният лимфен дренаж стимулира оттичането на лимфата, намалява отоците и усещането за тежест в крайниците.",
  },
  {
    title: "Целулит",
    text: "Антицелулитният масаж подобрява микроциркулацията и тонуса на тъканите като част от последователна терапия.",
  },
  {
    title: "Лошо кръвообращение",
    text: "Масажът активира кръвотока, подхранва тъканите и подпомага естественото възстановяване на тялото.",
  },
  {
    title: "Възстановяване след спорт",
    text: "След натоварване или травма помагам на мускулите да се възстановят по-бързо, да намаля болезнеността и да върна тонуса.",
  },
];

const QUALIFICATIONS: { title: string; lines: string[] }[] = [
  {
    title: "Базов курс масаж",
    lines: ['Академия „Дълголетие" — Варна', "110 учебни часа", "Професионална квалификация"],
  },
  {
    title: "Надграждащ курс масаж",
    lines: ['Академия „Дълголетие" — Варна', "75 учебни часа", "Втора степен професионална квалификация"],
  },
  {
    title: "Области, в които работя",
    lines: [
      "Лечебен и терапевтичен масаж",
      "Дълбокотъканен масаж · Лимфен дренаж",
      "Масаж при плексит, ишиас и дискова херния",
    ],
  },
];

const WHY: string[] = [
  "Индивидуален подход към всеки клиент",
  "Професионално обучение и квалификация",
  "Работа според конкретния проблем, а не по шаблон",
  "Комфортна и спокойна атмосфера",
  "Домашни посещения при нужда",
  "Пакети с отстъпки за редовни клиенти",
  "Работа само с предварително записан час",
];

export function AtsMassageSite({ data }: { data: SalonData }) {
  const { tenant, gallery, workingHours } = data;
  const services = servicesFlatForPublic(data).filter((s) => s.is_active);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const aboutRef = useReveal();
  const servicesRef = useReveal();
  const condRef = useReveal();
  const packagesRef = useReveal();
  const homeRef = useReveal();
  const whyRef = useReveal();
  const qualRef = useReveal();
  const galleryRef = useReveal();
  const bookingRef = useReveal();
  const contactRef = useReveal();

  const phone = tenant.phone?.trim() || FALLBACK_PHONE;
  const telHref = `tel:${phone.replace(/\s+/g, "")}`;
  const address = tenant.address?.trim() || FALLBACK_ADDRESS;
  const logo = tenant.logo_url?.trim();
  const heroImg = tenant.hero_image_url?.trim();
  const aboutImg = tenant.about_image_url?.trim();

  const fbHref = safeFacebookHref(tenant.facebook_url);
  const ttHref = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);

  const hasGallery = gallery.length > 0;

  const rootStyle: CSSProperties = {
    "--ats-midnight": "#0F2343",
    "--ats-midnight-deep": "#0A192F",
    "--ats-gold": "#C8A45A",
    "--ats-gold-soft": "#D8BC85",
    "--ats-ivory": "#F8F5EF",
    "--ats-graphite": "#2E2E2E",
    "--ats-sage": "#879A83",
    "--ats-line": "rgba(15,35,67,0.12)",
  } as CSSProperties;

  return (
    <div className="ats-root" style={rootStyle}>
      <style>{css}</style>

      {/* MOBILE MENU */}
      <div className={`ats-mmenu${menuOpen ? " open" : ""}`}>
        <button className="ats-mmenu-close" onClick={() => setMenuOpen(false)} type="button">
          ✕
        </button>
        <a href="#about" onClick={() => setMenuOpen(false)}>За мен</a>
        <a href="#services" onClick={() => setMenuOpen(false)}>Услуги</a>
        <a href="#conditions" onClick={() => setMenuOpen(false)}>Състояния</a>
        <a href="#packages" onClick={() => setMenuOpen(false)}>Пакети</a>
        <a href="#home-visits" onClick={() => setMenuOpen(false)}>Домашни посещения</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>Контакти</a>
        <a href="#booking" className="ats-mmenu-cta" onClick={() => setMenuOpen(false)}>Запази час</a>
      </div>

      {/* NAV */}
      <nav className={`ats-nav${scrolled ? " scrolled" : ""}`}>
        <a href="#hero" className="ats-nav-brand">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={tenant.salon_name} className="ats-nav-logo" />
          ) : (
            <span className="ats-nav-brand-text">{tenant.salon_name}</span>
          )}
        </a>
        <ul className="ats-nav-links">
          <li><a href="#about">За мен</a></li>
          <li><a href="#services">Услуги</a></li>
          <li><a href="#conditions">Състояния</a></li>
          <li><a href="#packages">Пакети</a></li>
          <li><a href="#contact">Контакти</a></li>
        </ul>
        <a href="#booking" className="ats-nav-cta">Запази час</a>
        <button className="ats-burger" onClick={() => setMenuOpen(true)} aria-label="Отвори меню" type="button">
          <span /><span /><span />
        </button>
      </nav>

      {/* HERO */}
      <section className="ats-hero" id="hero">
        {heroImg && (
          <div
            className="ats-hero-bg"
            style={{ backgroundImage: `url(${heroImg})` }}
            aria-hidden="true"
          />
        )}
        <div className="ats-hero-veil" aria-hidden="true" />
        <div className="ats-hero-inner">
          <p className="ats-hero-eyebrow">Терапевтичен масаж · Бургас</p>
          <h1 className="ats-hero-title">
            {tenant.hero_title?.trim() || (
              <>
                Професионална грижа
                <br />
                за вашето тяло
              </>
            )}
          </h1>
          <div className="ats-hero-rule" aria-hidden="true" />
          <p className="ats-hero-sub">
            {tenant.hero_subtitle?.trim() ||
              "Лечебен, терапевтичен и възстановителен масаж при болки в гърба, врата и кръста, дискова херния, ишиас и плексит. Реално облекчение — с индивидуален подход."}
          </p>
          <div className="ats-hero-actions">
            <a href="#booking" className="ats-btn ats-btn-gold">Запази час</a>
            <a href={telHref} className="ats-btn ats-btn-ghost">{phone}</a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="ats-about" id="about">
        <div className="ats-wrap">
          <div ref={aboutRef} className="ats-about-grid ats-reveal">
            <div className="ats-about-photo">
              {aboutImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={aboutImg} alt="Александър Цолов — терапевт" loading="lazy" />
              ) : (
                <div className="ats-about-photo-ph" aria-hidden="true">ATS</div>
              )}
              <span className="ats-about-photo-frame" aria-hidden="true" />
            </div>
            <div className="ats-about-body">
              <p className="ats-eyebrow">За мен</p>
              <h2 className="ats-h2">Александър Цолов</h2>
              <div className="ats-h2-rule" />
              <p className="ats-p">
                {tenant.about_text1?.trim() ||
                  "Казвам се Александър Цолов и съм професионален терапевт, специализиран в терапевтичния, лечебния и възстановителния масаж. Работата ми е насочена към хора, които търсят реално облекчение на болката, подобряване на движението и възстановяване след натоварване, травми или продължително обездвижване."}
              </p>
              <p className="ats-p">
                {tenant.about_text2?.trim() ||
                  "Вярвам, че добрият масаж не е еднакъв за всички. Подхождам индивидуално към всяко състояние, като комбинирам различни техники според нуждите на клиента. Целта ми не е просто приятен масаж, а тялото да възстанови своя баланс, подвижност и нормална функция."}
              </p>
              <div className="ats-about-tags">
                <span>Лечебен масаж</span>
                <span>Дълбокотъканен</span>
                <span>Лимфен дренаж</span>
                <span>Рефлексотерапия</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      {services.length > 0 && (
        <section className="ats-services" id="services">
          <div className="ats-wrap">
            <div ref={servicesRef} className="ats-reveal">
              <div className="ats-sec-hdr">
                <p className="ats-eyebrow ats-center">Ценоразпис</p>
                <h2 className="ats-h2 ats-center">Услуги</h2>
                <p className="ats-sec-note">Цените са с включен ДДС · приблизителна равностойност в лева</p>
              </div>
              <div className="ats-svc-list">
                {services.map((s: Service, i) => (
                  <div className="ats-svc" key={s.id}>
                    <span className="ats-svc-idx">{String(i + 1).padStart(2, "0")}</span>
                    <div className="ats-svc-main">
                      <span className="ats-svc-name">{s.name}</span>
                      {fmtDuration(s.duration_minutes) && (
                        <span className="ats-svc-dur">{fmtDuration(s.duration_minutes)}</span>
                      )}
                    </div>
                    <span className="ats-svc-dots" aria-hidden="true" />
                    <span className="ats-svc-price">
                      {eur(Number(s.price_eur))}
                      <span className="ats-svc-bgn">{bgn(Number(s.price_eur))}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="ats-center" style={{ marginTop: "2.6rem" }}>
                <a href="#booking" className="ats-btn ats-btn-midnight">Запази час</a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CONDITIONS — SEO */}
      <section className="ats-cond" id="conditions">
        <div className="ats-wrap">
          <div ref={condRef} className="ats-reveal">
            <div className="ats-sec-hdr">
              <p className="ats-eyebrow ats-center ats-eyebrow-light">С какви състояния работя</p>
              <h2 className="ats-h2 ats-center ats-h2-light">
                Кога терапевтичният масаж помага
              </h2>
              <p className="ats-sec-note ats-note-light">
                Работя с хора, които изпитват болка, напрежение или ограничена подвижност.
                Ето част от състоянията, при които терапевтичният масаж дава реален резултат.
              </p>
            </div>
            <div className="ats-cond-grid">
              {CONDITIONS.map((c) => (
                <article className="ats-cond-card" key={c.title}>
                  <h3 className="ats-cond-title">{c.title}</h3>
                  <p className="ats-cond-text">{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="ats-packages" id="packages">
        <div className="ats-wrap">
          <div ref={packagesRef} className="ats-reveal ats-pack-grid">
            <div className="ats-pack-copy">
              <p className="ats-eyebrow">Пакети</p>
              <h2 className="ats-h2">Инвестирайте в своето здраве</h2>
              <div className="ats-h2-rule" />
              <p className="ats-p">
                Пакетите важат както за пет, така и за десет масажа и са идеални за последователна
                терапия и по-траен резултат.
              </p>
            </div>
            <div className="ats-pack-cards">
              <div className="ats-pack-card">
                <span className="ats-pack-count">5<small>масажа</small></span>
                <span className="ats-pack-off">−10%</span>
                <span className="ats-pack-desc">от общата сума</span>
              </div>
              <div className="ats-pack-card ats-pack-card-hot">
                <span className="ats-pack-count">10<small>масажа</small></span>
                <span className="ats-pack-off">−20%</span>
                <span className="ats-pack-desc">от общата сума</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOME VISITS */}
      <section className="ats-home" id="home-visits">
        <div className="ats-wrap">
          <div ref={homeRef} className="ats-reveal ats-home-grid">
            <div>
              <p className="ats-eyebrow ats-eyebrow-light">Домашни посещения</p>
              <h2 className="ats-h2 ats-h2-light">Терапия във вашия дом</h2>
              <div className="ats-h2-rule" />
              <p className="ats-p ats-p-light">
                Удобство и грижа във вашия дом — подходящо за хора с ограничена подвижност,
                възрастни хора, след операция, за натоварени хора или за всеки, който предпочита
                терапия в спокойна домашна среда.
              </p>
            </div>
            <div className="ats-home-pricing">
              <div className="ats-home-row">
                <span>Бургас</span>
                <strong>+20% върху процедурата</strong>
              </div>
              <div className="ats-home-row">
                <span>Минимална такса</span>
                <strong>15 €</strong>
              </div>
              <div className="ats-home-row">
                <span>Извън Бургас</span>
                <strong>0.50 €/км транспорт</strong>
              </div>
              <p className="ats-home-note">Цени с включен ДДС</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="ats-why">
        <div className="ats-wrap">
          <div ref={whyRef} className="ats-reveal">
            <div className="ats-sec-hdr">
              <p className="ats-eyebrow ats-center">Защо ATS Studio</p>
              <h2 className="ats-h2 ats-center">Грижа, на която можете да разчитате</h2>
            </div>
            <ul className="ats-why-list">
              {WHY.map((w) => (
                <li key={w}>
                  <span className="ats-why-check" aria-hidden="true">✓</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* QUALIFICATIONS */}
      <section className="ats-qual">
        <div className="ats-wrap">
          <div ref={qualRef} className="ats-reveal">
            <div className="ats-sec-hdr">
              <p className="ats-eyebrow ats-center ats-eyebrow-light">Квалификация</p>
              <h2 className="ats-h2 ats-center ats-h2-light">Обучение и професионална подготовка</h2>
            </div>
            <div className="ats-qual-grid">
              {QUALIFICATIONS.map((q) => (
                <div className="ats-qual-card" key={q.title}>
                  <h3 className="ats-qual-title">{q.title}</h3>
                  <ul>
                    {q.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      {hasGallery && (
        <section className="ats-gallery">
          <div className="ats-wrap">
            <div ref={galleryRef} className="ats-reveal">
              <div className="ats-sec-hdr">
                <p className="ats-eyebrow ats-center">Студиото</p>
                <h2 className="ats-h2 ats-center">Атмосфера</h2>
              </div>
              <div className="ats-gal-grid">
                {gallery.map((img, i) => (
                  <div className="ats-gal-item" key={img.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`ATS Studio — снимка ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BOOKING */}
      <section className="ats-booking" id="booking">
        <div className="ats-wrap">
          <div ref={bookingRef} className="ats-reveal">
            <div className="ats-sec-hdr">
              <p className="ats-eyebrow ats-center ats-eyebrow-light">Запазете час</p>
              <h2 className="ats-h2 ats-center ats-h2-light">Резервирайте онлайн</h2>
              <p className="ats-sec-note ats-note-light">
                Работя само с предварително записан час. Изберете услуга, дата и час.
              </p>
            </div>
            <div className="ats-booking-card">
              <BookingFlow salonData={data} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="ats-contact" id="contact">
        <div className="ats-wrap">
          <div ref={contactRef} className="ats-reveal ats-contact-grid">
            <div className="ats-contact-info">
              <p className="ats-eyebrow">Контакти</p>
              <h2 className="ats-h2">С грижа за тялото</h2>
              <div className="ats-h2-rule" />
              <ul className="ats-contact-list">
                <li>
                  <span className="ats-contact-lbl">Адрес</span>
                  <span>{address}</span>
                </li>
                <li>
                  <span className="ats-contact-lbl">Телефон</span>
                  <a href={telHref}>{phone}</a>
                </li>
                <li>
                  <span className="ats-contact-lbl">Работно време</span>
                  <span>Само с предварително записан час</span>
                </li>
              </ul>
              {workingHours.length > 0 && (
                <div className="ats-hours">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const wh = workingHours.find((w) => w.day_of_week === d);
                    const off = !wh || wh.is_day_off;
                    return (
                      <div className="ats-hours-row" key={d}>
                        <span>{DAY_BG[d]}</span>
                        <span className={off ? "ats-hours-off" : undefined}>
                          {off ? "почивен" : `${wh!.start_time.slice(0, 5)}–${wh!.end_time.slice(0, 5)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {(fbHref || ttHref) && (
                <div className="ats-socials">
                  {fbHref && (
                    <a href={fbHref} target="_blank" rel="noopener noreferrer">Facebook</a>
                  )}
                  {ttHref && (
                    <a href={ttHref} target="_blank" rel="noopener noreferrer">TikTok</a>
                  )}
                </div>
              )}
              <a href="#booking" className="ats-btn ats-btn-gold" style={{ marginTop: "2rem" }}>
                Запази час
              </a>
            </div>
            <div className="ats-contact-map">
              {mapsSrc ? (
                <iframe
                  src={mapsSrc}
                  title="Карта"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="ats-map-ph" aria-hidden="true">
                  {address}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ats-footer">
        <div className="ats-wrap ats-footer-inner">
          <p className="ats-footer-brand">{tenant.salon_name}</p>
          <p className="ats-footer-tag">Терапевтичен масаж · Бургас</p>
          <p className="ats-footer-copy">
            © {new Date().getFullYear()} {tenant.salon_name}. Всички права запазени.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── styled ── */
const css = `
.ats-root {
  --f-serif: 'Cormorant Garamond', Georgia, serif;
  --f-sans: 'Inter', system-ui, sans-serif;
  font-family: var(--f-sans);
  color: var(--ats-graphite);
  background: var(--ats-ivory);
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
}
.ats-root *, .ats-root *::before, .ats-root *::after { box-sizing: border-box; }
.ats-root a { color: inherit; text-decoration: none; }
.ats-wrap { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 clamp(1.2rem, 4vw, 3rem); }

.ats-eyebrow {
  font-size: .72rem; letter-spacing: .32em; text-transform: uppercase;
  color: var(--ats-gold); font-weight: 600; margin: 0 0 1rem;
}
.ats-eyebrow-light { color: var(--ats-gold-soft); }
.ats-center { text-align: center; }
.ats-h2 {
  font-family: var(--f-serif); font-weight: 600;
  font-size: clamp(2rem, 4.4vw, 3.2rem); line-height: 1.08;
  letter-spacing: -.01em; color: var(--ats-midnight); margin: 0;
}
.ats-h2-light { color: var(--ats-ivory); }
.ats-h2-rule { width: 56px; height: 2px; background: var(--ats-gold); margin: 1.3rem 0 1.6rem; }
.ats-center .ats-h2-rule, .ats-sec-hdr .ats-h2-rule { margin-left: auto; margin-right: auto; }
.ats-p { font-size: 1.02rem; line-height: 1.85; color: #4a4a4a; margin: 0 0 1.15rem; max-width: 60ch; }
.ats-p-light { color: rgba(248,245,239,.82); }
.ats-sec-hdr { margin-bottom: 3rem; }
.ats-sec-note { font-size: .95rem; color: #6a6a6a; max-width: 62ch; margin: 1.1rem auto 0; text-align: center; line-height: 1.7; }
.ats-note-light { color: rgba(248,245,239,.72); }

.ats-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: .95rem 2.1rem; border-radius: 999px;
  font-size: .82rem; letter-spacing: .12em; text-transform: uppercase; font-weight: 600;
  transition: transform .2s ease, background .2s ease, color .2s ease, box-shadow .2s ease;
  cursor: pointer; border: 1px solid transparent;
}
.ats-btn:hover { transform: translateY(-2px); }
.ats-btn-gold { background: var(--ats-gold); color: var(--ats-midnight-deep); box-shadow: 0 10px 30px -12px rgba(200,164,90,.7); }
.ats-btn-gold:hover { background: var(--ats-gold-soft); }
.ats-btn-midnight { background: var(--ats-midnight); color: var(--ats-ivory); }
.ats-btn-midnight:hover { background: var(--ats-midnight-deep); }
.ats-btn-ghost { background: transparent; border-color: rgba(248,245,239,.4); color: var(--ats-ivory); }
.ats-btn-ghost:hover { border-color: var(--ats-gold); color: var(--ats-gold-soft); }

.ats-reveal { opacity: 0; transform: translateY(26px); transition: opacity .8s ease, transform .8s ease; }
.ats-reveal[data-v="1"] { opacity: 1; transform: none; }

/* NAV */
.ats-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem clamp(1.2rem, 4vw, 3rem);
  transition: background .3s ease, box-shadow .3s ease, padding .3s ease;
}
.ats-nav.scrolled { background: rgba(15,35,67,.96); box-shadow: 0 8px 30px -18px rgba(0,0,0,.6); padding-top: .7rem; padding-bottom: .7rem; backdrop-filter: blur(8px); }
.ats-nav-logo { height: 46px; width: auto; display: block; }
.ats-nav.scrolled .ats-nav-logo { height: 40px; }
.ats-nav-brand-text { font-family: var(--f-serif); font-size: 1.5rem; font-weight: 700; color: var(--ats-ivory); letter-spacing: .04em; }
.ats-nav-links { display: flex; gap: 2rem; list-style: none; margin: 0; padding: 0; }
.ats-nav-links a {
  font-size: .82rem; letter-spacing: .08em; color: rgba(248,245,239,.85); font-weight: 500;
  position: relative; padding-bottom: 3px;
}
.ats-nav-links a::after { content: ""; position: absolute; left: 0; bottom: 0; width: 0; height: 1px; background: var(--ats-gold); transition: width .25s ease; }
.ats-nav-links a:hover { color: #fff; }
.ats-nav-links a:hover::after { width: 100%; }
.ats-nav-cta { display: inline-flex; align-items: center; padding: .6rem 1.5rem; border-radius: 999px; background: var(--ats-gold); color: var(--ats-midnight-deep); font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; font-weight: 600; transition: background .2s ease; }
.ats-nav-cta:hover { background: var(--ats-gold-soft); }
.ats-burger { display: none; flex-direction: column; gap: 5px; background: none; border: 0; cursor: pointer; padding: 6px; }
.ats-burger span { width: 24px; height: 2px; background: var(--ats-ivory); border-radius: 2px; }

.ats-mmenu {
  position: fixed; inset: 0; z-index: 60; background: var(--ats-midnight-deep);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.6rem;
  opacity: 0; pointer-events: none; transition: opacity .3s ease;
}
.ats-mmenu.open { opacity: 1; pointer-events: auto; }
.ats-mmenu a { font-family: var(--f-serif); font-size: 1.8rem; color: var(--ats-ivory); }
.ats-mmenu-cta { color: var(--ats-gold) !important; }
.ats-mmenu-close { position: absolute; top: 1.4rem; right: 1.4rem; background: none; border: 0; color: var(--ats-ivory); font-size: 1.6rem; cursor: pointer; }

/* HERO */
.ats-hero {
  position: relative; min-height: 100svh; display: flex; align-items: center;
  background: linear-gradient(160deg, var(--ats-midnight) 0%, var(--ats-midnight-deep) 100%);
  overflow: hidden;
}
.ats-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
.ats-hero-veil { position: absolute; inset: 0; background: linear-gradient(105deg, rgba(10,25,47,.94) 0%, rgba(10,25,47,.78) 42%, rgba(10,25,47,.42) 100%); }
.ats-hero-inner { position: relative; z-index: 2; width: 100%; max-width: 1180px; margin: 0 auto; padding: 7rem clamp(1.2rem,4vw,3rem) 4rem; }
.ats-hero-eyebrow { font-size: .78rem; letter-spacing: .34em; text-transform: uppercase; color: var(--ats-gold-soft); font-weight: 600; margin: 0 0 1.4rem; }
.ats-hero-title { font-family: var(--f-serif); font-weight: 600; font-size: clamp(2.6rem, 7vw, 5rem); line-height: 1.04; letter-spacing: -.015em; color: var(--ats-ivory); margin: 0; max-width: 16ch; }
.ats-hero-rule { width: 64px; height: 2px; background: var(--ats-gold); margin: 1.8rem 0; }
.ats-hero-sub { font-size: clamp(1rem, 1.6vw, 1.15rem); line-height: 1.75; color: rgba(248,245,239,.82); max-width: 52ch; margin: 0 0 2.4rem; }
.ats-hero-actions { display: flex; flex-wrap: wrap; gap: 1rem; }

/* ABOUT */
.ats-about { padding: clamp(5rem, 10vw, 8rem) 0; }
.ats-about-grid { display: grid; grid-template-columns: 0.95fr 1.05fr; gap: clamp(2.5rem, 6vw, 5.5rem); align-items: center; }
.ats-about-photo { position: relative; aspect-ratio: 4/5; border-radius: 18px; overflow: hidden; }
.ats-about-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ats-about-photo-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--ats-midnight); color: var(--ats-gold); font-family: var(--f-serif); font-size: 3rem; letter-spacing: .2em; }
.ats-about-photo-frame { position: absolute; inset: 14px; border: 1px solid rgba(248,245,239,.35); border-radius: 12px; pointer-events: none; }
.ats-about-tags { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.6rem; }
.ats-about-tags span { font-size: .76rem; letter-spacing: .06em; padding: .45rem 1rem; border-radius: 999px; background: rgba(135,154,131,.16); color: #5f7159; font-weight: 600; }

/* SERVICES */
.ats-services { padding: clamp(4.5rem, 9vw, 7.5rem) 0; background: #fff; }
.ats-svc-list { max-width: 800px; margin: 0 auto; }
.ats-svc { display: flex; align-items: baseline; gap: .6rem; padding: 1.15rem 0; border-bottom: 1px solid var(--ats-line); }
.ats-svc-idx { font-family: var(--f-serif); font-size: .9rem; color: var(--ats-gold); font-weight: 700; width: 1.8rem; flex: none; }
.ats-svc-main { display: flex; flex-direction: column; gap: .2rem; }
.ats-svc-name { font-size: 1.08rem; font-weight: 600; color: var(--ats-midnight); }
.ats-svc-dur { font-size: .8rem; color: #8a8a8a; letter-spacing: .02em; }
.ats-svc-dots { flex: 1; border-bottom: 1px dotted rgba(15,35,67,.25); transform: translateY(-4px); min-width: 20px; }
.ats-svc-price { display: flex; flex-direction: column; align-items: flex-end; font-size: 1.1rem; font-weight: 700; color: var(--ats-midnight); flex: none; }
.ats-svc-bgn { font-size: .74rem; font-weight: 500; color: #9a9a9a; }

/* CONDITIONS */
.ats-cond { padding: clamp(5rem, 10vw, 8rem) 0; background: linear-gradient(165deg, var(--ats-midnight) 0%, var(--ats-midnight-deep) 100%); }
.ats-cond-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.4rem; }
.ats-cond-card { background: rgba(248,245,239,.04); border: 1px solid rgba(200,164,90,.18); border-radius: 14px; padding: 1.8rem; transition: border-color .25s ease, transform .25s ease, background .25s ease; }
.ats-cond-card:hover { border-color: rgba(200,164,90,.55); transform: translateY(-3px); background: rgba(248,245,239,.06); }
.ats-cond-title { font-family: var(--f-serif); font-size: 1.4rem; font-weight: 600; color: var(--ats-gold-soft); margin: 0 0 .7rem; }
.ats-cond-text { font-size: .92rem; line-height: 1.7; color: rgba(248,245,239,.72); margin: 0; }

/* PACKAGES */
.ats-packages { padding: clamp(4.5rem, 9vw, 7rem) 0; }
.ats-pack-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2.5rem, 6vw, 5rem); align-items: center; }
.ats-pack-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.ats-pack-card { background: #fff; border: 1px solid var(--ats-line); border-radius: 16px; padding: 2.2rem 1.4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: .5rem; }
.ats-pack-card-hot { background: var(--ats-midnight); border-color: var(--ats-midnight); }
.ats-pack-count { font-family: var(--f-serif); font-size: 3rem; line-height: 1; font-weight: 700; color: var(--ats-midnight); display: flex; flex-direction: column; }
.ats-pack-count small { font-family: var(--f-sans); font-size: .72rem; letter-spacing: .18em; text-transform: uppercase; font-weight: 600; color: #9a9a9a; margin-top: .3rem; }
.ats-pack-card-hot .ats-pack-count { color: var(--ats-ivory); }
.ats-pack-card-hot .ats-pack-count small { color: rgba(248,245,239,.6); }
.ats-pack-off { font-size: 1.9rem; font-weight: 800; color: var(--ats-gold); letter-spacing: -.02em; }
.ats-pack-desc { font-size: .74rem; letter-spacing: .1em; text-transform: uppercase; color: #9a9a9a; }
.ats-pack-card-hot .ats-pack-desc { color: rgba(248,245,239,.55); }

/* HOME VISITS */
.ats-home { padding: clamp(4.5rem, 9vw, 7rem) 0; background: var(--ats-sage); }
.ats-home-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: clamp(2.5rem, 6vw, 5rem); align-items: center; }
.ats-home .ats-h2-light, .ats-home .ats-eyebrow-light { color: #fff; }
.ats-home .ats-eyebrow-light { color: rgba(255,255,255,.85); }
.ats-home .ats-h2-rule { background: #fff; }
.ats-home-pricing { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 16px; padding: 2rem; }
.ats-home-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; padding: .95rem 0; border-bottom: 1px solid rgba(255,255,255,.22); }
.ats-home-row:last-of-type { border-bottom: 0; }
.ats-home-row span { color: rgba(255,255,255,.9); font-size: .95rem; }
.ats-home-row strong { color: #fff; font-size: 1rem; text-align: right; }
.ats-home-note { margin: 1rem 0 0; font-size: .78rem; color: rgba(255,255,255,.75); }

/* WHY */
.ats-why { padding: clamp(4.5rem, 9vw, 7rem) 0; background: #fff; }
.ats-why-list { list-style: none; margin: 0 auto; padding: 0; max-width: 820px; display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem 2.4rem; }
.ats-why-list li { display: flex; align-items: flex-start; gap: .9rem; font-size: 1.02rem; color: var(--ats-graphite); line-height: 1.5; }
.ats-why-check { flex: none; width: 26px; height: 26px; border-radius: 50%; background: rgba(135,154,131,.18); color: #5f7159; display: inline-flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; margin-top: 1px; }

/* QUALIFICATIONS */
.ats-qual { padding: clamp(5rem, 10vw, 8rem) 0; background: var(--ats-midnight-deep); }
.ats-qual-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.4rem; }
.ats-qual-card { border: 1px solid rgba(200,164,90,.22); border-radius: 14px; padding: 2rem; background: rgba(248,245,239,.03); }
.ats-qual-title { font-family: var(--f-serif); font-size: 1.35rem; color: var(--ats-gold-soft); margin: 0 0 1.1rem; }
.ats-qual-card ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .6rem; }
.ats-qual-card li { font-size: .92rem; color: rgba(248,245,239,.75); line-height: 1.5; padding-left: 1.1rem; position: relative; }
.ats-qual-card li::before { content: "—"; position: absolute; left: 0; color: var(--ats-gold); }

/* GALLERY */
.ats-gallery { padding: clamp(4.5rem, 9vw, 7rem) 0; }
.ats-gal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.ats-gal-item { aspect-ratio: 3/4; border-radius: 12px; overflow: hidden; }
.ats-gal-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s ease; }
.ats-gal-item:hover img { transform: scale(1.05); }

/* BOOKING */
.ats-booking { padding: clamp(5rem, 10vw, 8rem) 0; background: linear-gradient(165deg, var(--ats-midnight) 0%, var(--ats-midnight-deep) 100%); }
.ats-booking-card { background: var(--ats-ivory); border-radius: 20px; padding: clamp(1.4rem, 3vw, 2.6rem); max-width: 920px; margin: 0 auto; box-shadow: 0 40px 80px -40px rgba(0,0,0,.5); }

/* CONTACT */
.ats-contact { padding: clamp(4.5rem, 9vw, 7rem) 0; background: #fff; }
.ats-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2.5rem, 6vw, 4.5rem); align-items: stretch; }
.ats-contact-list { list-style: none; margin: 0 0 1.6rem; padding: 0; display: flex; flex-direction: column; gap: 1.1rem; }
.ats-contact-list li { display: flex; flex-direction: column; gap: .25rem; }
.ats-contact-lbl { font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ats-gold); font-weight: 600; }
.ats-contact-list a, .ats-contact-list span:not(.ats-contact-lbl) { font-size: 1.05rem; color: var(--ats-midnight); }
.ats-hours { border-top: 1px solid var(--ats-line); padding-top: 1.2rem; margin-bottom: 1.4rem; }
.ats-hours-row { display: flex; justify-content: space-between; padding: .35rem 0; font-size: .92rem; color: #555; }
.ats-hours-off { color: #b0b0b0; }
.ats-socials { display: flex; gap: 1.4rem; }
.ats-socials a { font-size: .82rem; letter-spacing: .08em; text-transform: uppercase; color: var(--ats-midnight); font-weight: 600; border-bottom: 1px solid var(--ats-gold); padding-bottom: 2px; }
.ats-contact-map { border-radius: 16px; overflow: hidden; min-height: 340px; background: var(--ats-ivory); }
.ats-contact-map iframe { width: 100%; height: 100%; min-height: 340px; border: 0; display: block; }
.ats-map-ph { width: 100%; height: 100%; min-height: 340px; display: flex; align-items: center; justify-content: center; color: #9a9a9a; font-size: .95rem; text-align: center; padding: 2rem; }

/* FOOTER */
.ats-footer { background: var(--ats-midnight-deep); padding: 3.5rem 0; text-align: center; }
.ats-footer-brand { font-family: var(--f-serif); font-size: 1.8rem; font-weight: 700; color: var(--ats-ivory); margin: 0 0 .5rem; letter-spacing: .04em; }
.ats-footer-tag { font-size: .78rem; letter-spacing: .2em; text-transform: uppercase; color: var(--ats-gold-soft); margin: 0 0 1.6rem; }
.ats-footer-copy { font-size: .78rem; color: rgba(248,245,239,.4); margin: 0; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .ats-nav-links, .ats-nav-cta { display: none; }
  .ats-burger { display: flex; }
  .ats-about-grid, .ats-pack-grid, .ats-home-grid, .ats-contact-grid { grid-template-columns: 1fr; }
  .ats-why-list { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .ats-pack-cards { grid-template-columns: 1fr; }
  .ats-svc-bgn { display: none; }
  .ats-hero-actions .ats-btn { width: 100%; }
}
`;
