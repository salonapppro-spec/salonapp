import Image from "next/image";
import { Manrope, Prata } from "next/font/google";

import type { SalonData, WorkingHours } from "@/types/database";
import { safeFacebookHref, safeGoogleMapsEmbedSrc, safeInstagramHref, safeTiktokHref } from "@/lib/safe-public-urls";

import { TaniaBooking } from "./TaniaBooking";
import { TaniaGallery, type GalleryItem } from "./TaniaGallery";
import { TaniaNav } from "./TaniaNav";
import { TaniaReveal } from "./TaniaReveal";
import {
  TANIA_BEFORE_AFTER,
  TANIA_BRANDS,
  TANIA_GALLERY,
  TANIA_IMG,
  TANIA_ON_REQUEST,
  TANIA_TRAININGS,
  TANIA_TRAINING_PHOTOS,
  WEEK_ORDER,
  dayLabel,
  durationLabel,
  eurLabel,
  groupServices,
  hhmm,
  shortName,
} from "./data";

/* ────────────────────────────────────────────────────────────────
   Фризьорски салон Таня · гр. Бургас, ул. „Цар Самуил“ 64
   Дизайн посока „Топла лента“: преливащи златно-бежови ленти,
   разделени с вълни, дисплей сериф Prata + Manrope за текста.
   Всички услуги, цени, график и контакти идват от базата (SalonData);
   локални са само hero/за-нас снимките и галерията по подразбиране.
   ──────────────────────────────────────────────────────────────── */

const prata = Prata({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--t-display-font",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--t-body-font",
  display: "swap",
});

const FALLBACK_PHONE = "+359 897 902 333";
const FALLBACK_ADDRESS = "ул. „Цар Самуил“ 64, гр. Бургас";
const FALLBACK_MAPS = `https://maps.google.com/maps?q=${encodeURIComponent("ул. Цар Самуил 64, Бургас")}&z=17&output=embed`;

/** Работно време по подразбиране, ако графикът още не е попълнен в админ панела. */
const FALLBACK_HOURS: Pick<WorkingHours, "day_of_week" | "start_time" | "end_time" | "is_day_off">[] =
  [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
    day_of_week: day_of_week as WorkingHours["day_of_week"],
    start_time: "09:30",
    end_time: "18:00",
    is_day_off: day_of_week === 0,
  }));

/** Знакът на Facebook, чертан inline — без външни файлове и CDN-и. */
function FacebookMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

/** Знакът на Instagram, чертан inline — без външни файлове и CDN-и. */
function InstagramMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Разделител между лентите. Три амплитуди — всяка граница изглежда различно. */
function Wave({ variant, fill, className }: { variant: 1 | 2 | 3; fill: string; className?: string }) {
  const paths: Record<1 | 2 | 3, string> = {
    1: "M0,64 C240,120 420,8 720,44 C1020,80 1200,16 1440,56 L1440,140 L0,140 Z",
    2: "M0,40 C180,0 360,96 600,84 C900,68 1080,4 1440,48 L1440,140 L0,140 Z",
    3: "M0,88 C260,20 480,104 760,72 C1040,40 1240,96 1440,32 L1440,140 L0,140 Z",
  };
  return (
    <svg className={`t-wave${className ? ` ${className}` : ""}`} viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={paths[variant]} fill={fill} />
    </svg>
  );
}

export function TaniaSite({ data }: { data: SalonData }) {
  const { tenant } = data;

  const salonName = tenant.salon_name || "Фризьорски салон Таня";
  const phone = tenant.phone?.trim() || tenant.owner_phone?.trim() || FALLBACK_PHONE;
  const address = tenant.address?.trim() || FALLBACK_ADDRESS;
  const email = tenant.email?.trim() || tenant.owner_email?.trim() || null;

  const facebook = safeFacebookHref(tenant.facebook_url);
  const instagram = safeInstagramHref(tenant.instagram_url);
  const tiktok = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed) ?? safeGoogleMapsEmbedSrc(FALLBACK_MAPS);

  const groups = groupServices(data.services);
  const hours = data.workingHours.length > 0 ? data.workingHours : FALLBACK_HOURS;
  const hoursByDay = new Map(hours.map((h) => [h.day_of_week, h]));

  /* Галерията идва от базата, щом собственикът качи снимки; иначе — тези на клиента. */
  const gallery: GalleryItem[] =
    data.gallery.length > 0
      ? data.gallery.map((g, i) => ({ src: g.url, alt: `${salonName} — снимка ${i + 1}` }))
      : TANIA_GALLERY;

  const openDays = hours.filter((h) => !h.is_day_off);
  const hoursSummary =
    openDays.length > 0
      ? `${hhmm(openDays[0].start_time)} – ${hhmm(openDays[0].end_time)}`
      : "по договаряне";

  return (
    <div className={`t-site ${prata.variable} ${manrope.variable}`}>
      <style>{CSS}</style>
      <TaniaReveal />
      <TaniaNav salonName={salonName} phone={phone} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="t-hero" id="nachalo">
        <div className="t-hero-glow" aria-hidden="true" />
        <div className="t-wrap t-hero-inner">
          <div className="t-hero-copy">
            <p className="t-eyebrow">Бургас · ул. „Цар Самуил“ 64</p>
            <h1 className="t-hero-title">
              Косата ви<br />
              <em>в опитни ръце</em>
            </h1>
            <p className="t-hero-lead">
              Фризьорски салон Таня работи в центъра на Бургас — подстригване, боядисване, кичури,
              къдрене и официални прически за жени, мъже и деца. Записвате час онлайн, за минута.
            </p>
            <div className="t-hero-cta">
              <a className="t-btn" href="#rezervaciya">Запази час онлайн</a>
              <a className="t-btn ghost" href="#cenorazpis">Виж ценоразписа</a>
            </div>
            <dl className="t-hero-facts">
              <div><dt>Работно време</dt><dd>Пн – Сб · {hoursSummary}</dd></div>
              <div><dt>Телефон</dt><dd><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></dd></div>
            </dl>
          </div>

          <div className="t-hero-photo">
            <Image
              src={TANIA_IMG.hero}
              alt="Официална прическа с прибрани къдрици и бели рози, изработена във фризьорски салон Таня"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
              className="t-hero-img"
            />
            <span className="t-hero-frame" aria-hidden="true" />
          </div>
        </div>
        <Wave variant={1} fill="var(--t-cocoa)" className="t-wave-bottom" />
      </section>

      {/* ── ЛЕНТА С ФАКТИ ────────────────────────────────────── */}
      <section className="t-ribbon" aria-label="Накратко за салона">
        <div className="t-wrap t-ribbon-grid">
          <div data-reveal><span className="t-ribbon-k">Дамско, мъжко и детско</span><span className="t-ribbon-v">Целият салон на едно място</span></div>
          <div data-reveal><span className="t-ribbon-k">Schwarzkopf ASK Education</span><span className="t-ribbon-v">Сертификат за колорит и AIR TOUCH</span></div>
          <div data-reveal><span className="t-ribbon-k">Пн – Сб</span><span className="t-ribbon-v">{hoursSummary}</span></div>
          <div data-reveal><span className="t-ribbon-k">Онлайн записване</span><span className="t-ribbon-v">Без обаждане, по всяко време</span></div>
        </div>
        <Wave variant={2} fill="var(--t-cream)" className="t-wave-bottom" />
      </section>

      {/* ── ЗА МЕН ───────────────────────────────────────────── */}
      <section className="t-about" id="za-nas">
        <div className="t-wrap">
          <div className="t-about-hero" data-reveal>
            <Image
              src={TANIA_IMG.tania}
              alt="Таня Папазова пред фризьорския си салон в Бургас на 25-годишнината му, с торта и балони"
              width={1600}
              height={1228}
              sizes="(max-width: 1180px) 100vw, 1180px"
              className="t-about-img"
            />
            <span className="t-about-years" aria-hidden="true"><b>25</b><i>години</i></span>
          </div>

          <div className="t-about-grid">
            <div className="t-about-copy" data-reveal>
              <p className="t-eyebrow">За мен</p>
              <h2 className="t-h2">Здравей!<br /><em>Аз съм Таня</em></h2>
              <p>
                Казвам се Таня Папазова и вече над 25 години стоя зад стола в този салон.
                През тези години съм минала през безброй обучения и семинари — следя новите
                техники и продукти, защото всяка коса е различна и не прощава компромиси.
              </p>
              <p>
                С редовните ми клиенти отдавна не сме просто фризьор и клиент. С някои сме
                приятели. Грижа се за ежедневната им визия, но съм до тях
                и в дните, които се помнят: сватби, абитуриентски балове, кръщенета, юбилеи.
              </p>
              <p>
                Затова обичам тази работа. Не заради самата прическа, а заради лицето на човека
                срещу огледалото, когато я види — и заради усмивката, с която излиза от вратата.
              </p>
              <p className="t-about-sign">Заповядай. Ще намерим твоята визия заедно.</p>
              <a className="t-btn" href="#rezervaciya">Запази час</a>
            </div>

            <div className="t-about-side" data-reveal>
              <figure className="t-about-shot">
                <Image
                  src={TANIA_IMG.certificate}
                  alt="Таня Папазова със сертификат от ASK Education на Schwarzkopf Professional"
                  width={900}
                  height={1827}
                  sizes="(max-width: 900px) 92vw, 30vw"
                  className="t-about-img"
                />
                <figcaption>Сертификат ASK Education на Schwarzkopf Professional — колорит и AIR TOUCH</figcaption>
              </figure>
            </div>
          </div>
        </div>
        <Wave variant={2} fill="var(--t-sand)" className="t-wave-bottom" />
      </section>

      {/* ── ОБУЧЕНИЯ ────────────────────────────────────────── */}
      <section className="t-train" aria-labelledby="t-train-title">
        <div className="t-wrap">
          <header className="t-sec-head" data-reveal>
            <p className="t-eyebrow">Обучения</p>
            <h2 className="t-h2" id="t-train-title">Където се уча</h2>
            <p className="t-sec-lead">
              Техниките и продуктите се менят непрекъснато. Затова всяка година минавам през
              обучения и семинари — за да идва новото при вас проверено, а не на проба.
            </p>
          </header>

          <ul className="t-train-list">
            {TANIA_TRAININGS.map((t) => (
              <li className="t-train-item" key={t.name} data-reveal>
                <h3 className="t-train-name">{t.name}</h3>
                <p className="t-train-note">{t.note}</p>
              </li>
            ))}
          </ul>

          <ul className="t-train-shots" data-reveal>
            {TANIA_TRAINING_PHOTOS.map((p) => (
              <li key={p.src}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={900}
                  height={1200}
                  sizes="(max-width: 640px) 92vw, (max-width: 1000px) 31vw, 360px"
                  className="t-train-img"
                />
              </li>
            ))}
          </ul>
        </div>
        <Wave variant={3} fill="var(--t-cocoa)" className="t-wave-bottom" />
      </section>

      {/* ── МАРКИ В САЛОНА ──────────────────────────────────── */}
      <section className="t-brands" aria-labelledby="t-brands-title">
        <div className="t-wrap">
          <header className="t-brands-head" data-reveal>
            <p className="t-eyebrow light">Козметика в салона</p>
            <h2 className="t-h2 light" id="t-brands-title">Марките, с които работя</h2>
            <p className="t-brands-lead">
              Продуктите, с които се грижа за косата ви в салона, можете да купите и за вкъщи —
              на място, без поръчка и чакане.
            </p>
          </header>
          <ul className="t-brand-row" data-reveal>
            {TANIA_BRANDS.map((b) => (
              <li key={b.name}>
                <span className="t-brand-name">{b.name}</span>
                <span className="t-brand-note">{b.note}</span>
              </li>
            ))}
          </ul>
        </div>
        <Wave variant={2} fill="var(--t-sand)" className="t-wave-bottom" />
      </section>

      {/* ── ЦЕНОРАЗПИС ──────────────────────────────────────── */}
      <section className="t-prices" id="cenorazpis">
        <div className="t-wrap">
          <header className="t-sec-head" data-reveal>
            <p className="t-eyebrow">Ценоразпис</p>
            <h2 className="t-h2">Цени и времетраене</h2>
          </header>

          {groups.length === 0 ? (
            <p className="t-empty">Ценоразписът се обновява. Обадете се на {phone} за актуални цени.</p>
          ) : (
            <div className="t-price-cols">
              {groups.map((g) => (
                <section className="t-price-group" key={g.title} data-reveal>
                  <h3 className="t-price-cat">{g.title}</h3>
                  <ul className="t-price-list">
                    {g.items.map((s) => {
                      const dur = durationLabel(s.duration_minutes);
                      return (
                        <li className="t-price-row" key={s.id}>
                          <span className="t-price-name">
                            {shortName(s.name, g.title)}
                            {dur && <em> · {dur}</em>}
                          </span>
                          <span className="t-price-dots" aria-hidden="true" />
                          <span className="t-price-val">
                            <strong>{eurLabel(s)}</strong>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <section className="t-request" data-reveal>
            <h3 className="t-price-cat">След консултация</h3>
            <p className="t-request-lead">
              За тези услуги цената и времето се определят индивидуално — според дължината,
              текущия цвят и състоянието на косата. Обадете се или заповядайте за консултация.
            </p>
            <ul className="t-request-list">
              {TANIA_ON_REQUEST.map((r) => (
                <li key={r.name}>
                  <strong>{r.name}</strong>
                  <span>{r.note}</span>
                </li>
              ))}
            </ul>
            <a className="t-btn small" href={`tel:${phone.replace(/\s/g, "")}`}>Обади се: {phone}</a>
          </section>

          <div className="t-prices-cta" data-reveal>
            <a className="t-btn" href="#rezervaciya">Запази час</a>
          </div>
        </div>
        <Wave variant={1} fill="var(--t-cream)" className="t-wave-bottom" />
      </section>

      {/* ── ПРЕДИ / СЛЕД ────────────────────────────────────── */}
      <section className="t-ba" aria-labelledby="t-ba-title">
        <div className="t-wrap">
          <header className="t-sec-head" data-reveal>
            <p className="t-eyebrow">От работата ни</p>
            <h2 className="t-h2" id="t-ba-title">Преди и след</h2>
          </header>
          <div className="t-ba-grid">
            {TANIA_BEFORE_AFTER.map((pair) => (
              <figure className="t-ba-card" key={pair.title} data-reveal>
                <div className="t-ba-pair">
                  <div className="t-ba-shot">
                    <Image src={pair.before.src} alt={pair.before.alt} width={752} height={1020} sizes="(max-width: 700px) 44vw, 240px" className="t-ba-img" />
                    <span>преди</span>
                  </div>
                  <div className="t-ba-shot">
                    <Image src={pair.after.src} alt={pair.after.alt} width={752} height={1020} sizes="(max-width: 700px) 44vw, 240px" className="t-ba-img" />
                    <span className="after">след</span>
                  </div>
                </div>
                <figcaption>
                  <strong>{pair.title}</strong>
                  <span>{pair.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <Wave variant={2} fill="var(--t-sand)" className="t-wave-bottom" />
      </section>

      {/* ── ГАЛЕРИЯ ─────────────────────────────────────────── */}
      <section className="t-gallery" id="galeriya">
        <div className="t-wrap">
          <header className="t-sec-head" data-reveal>
            <p className="t-eyebrow">Галерия</p>
            <h2 className="t-h2">Прически, направени тук</h2>
          </header>
          <div data-reveal>
            <TaniaGallery items={gallery} />
          </div>
        </div>
        <Wave variant={3} fill="var(--t-cocoa)" className="t-wave-bottom" />
      </section>

      {/* ── РЕЗЕРВАЦИЯ ──────────────────────────────────────── */}
      <section className="t-book" id="rezervaciya">
        <div className="t-wrap t-book-grid">
          <div className="t-book-intro" data-reveal>
            <p className="t-eyebrow light">Резервация</p>
            <h2 className="t-h2 light">Запази час<br /><em>за минута</em></h2>
            <p>
              Изберете услуга, ден и свободен час. Ще получите потвърждение на имейл,
              а преди самия час — и напомняне.
            </p>
            <ul className="t-book-hours">
              {WEEK_ORDER.map((d) => {
                const h = hoursByDay.get(d);
                const off = !h || h.is_day_off;
                return (
                  <li key={d} className={off ? "off" : ""}>
                    <span>{dayLabel(d)}</span>
                    <span>{off ? "почивен" : `${hhmm(h.start_time)} – ${hhmm(h.end_time)}`}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="t-book-panel" data-reveal>
            <TaniaBooking data={data} />
          </div>
        </div>
        <Wave variant={1} fill="var(--t-cream)" className="t-wave-bottom" />
      </section>

      {/* ── КОНТАКТИ ────────────────────────────────────────── */}
      <section className="t-contact" id="kontakti">
        <div className="t-wrap t-contact-grid">
          <div className="t-contact-copy" data-reveal>
            <p className="t-eyebrow">Контакти</p>
            <h2 className="t-h2">Заповядайте<br /><em>в салона</em></h2>
            <dl className="t-contact-list">
              <div>
                <dt>Адрес</dt>
                <dd>{address}</dd>
              </div>
              <div>
                <dt>Телефон</dt>
                <dd><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></dd>
              </div>
              {email && (
                <div>
                  <dt>Имейл</dt>
                  <dd><a href={`mailto:${email}`}>{email}</a></dd>
                </div>
              )}
              <div>
                <dt>Работно време</dt>
                <dd>Понеделник – събота · {hoursSummary}<br />Неделя — почивен ден</dd>
              </div>
            </dl>
            {(facebook || instagram || tiktok) && (
              <div className="t-social">
                {facebook && (
                  <a className="t-social-fb" href={facebook} target="_blank" rel="noopener noreferrer">
                    <FacebookMark className="t-social-ico" />
                    <span>Следвайте ни във Facebook</span>
                  </a>
                )}
                {instagram && (
                  <a className="t-social-ig" href={instagram} target="_blank" rel="noopener noreferrer">
                    <InstagramMark className="t-social-ico" />
                    <span>Instagram</span>
                  </a>
                )}
                {tiktok && <a href={tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>}
              </div>
            )}
          </div>

          <div className="t-map" data-reveal>
            {mapsSrc ? (
              <iframe
                src={mapsSrc}
                title={`Карта — ${salonName}, ${address}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <p className="t-empty">{address}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── ФУТЪР ───────────────────────────────────────────── */}
      <footer className="t-footer">
        <div className="t-wrap t-footer-inner">
          <div>
            <p className="t-footer-brand">{salonName}</p>
            <p className="t-footer-addr">{address}</p>
          </div>
          <nav className="t-footer-nav" aria-label="Долна навигация">
            <a href="#za-nas">За мен</a>
            <a href="#cenorazpis">Ценоразпис</a>
            <a href="#galeriya">Галерия</a>
            <a href="#rezervaciya">Запази час</a>
            {facebook && (
              <a
                className="t-footer-fb"
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${salonName} във Facebook`}
              >
                <FacebookMark className="t-footer-fb-ico" />
              </a>
            )}
            {instagram && (
              <a
                className="t-footer-fb t-footer-ig"
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${salonName} в Instagram`}
              >
                <InstagramMark className="t-footer-fb-ico" />
              </a>
            )}
          </nav>
          <p className="t-footer-note">
            © {new Date().getFullYear()} {salonName}. Онлайн записване от{" "}
            <a href="https://salonapp.pro" target="_blank" rel="noopener noreferrer">SalonApp.pro</a>
          </p>
        </div>
      </footer>

      {/* Мобилна лента — крие се, докато формата за резервация е на екрана. */}
      <div className="t-sticky">
        <a className="t-sticky-call" href={`tel:${phone.replace(/\s/g, "")}`} aria-label="Обади се в салона">Обади се</a>
        <a className="t-sticky-cta" href="#rezervaciya">Запази час</a>
      </div>
    </div>
  );
}

const CSS = `
.t-site {
  --t-cream: #FDFAF4;
  --t-sand: #F7EFE2;
  --t-champagne: #E8D2A6;
  --t-gold: #B9863C;
  --t-gold-deep: #96682A;
  --t-cocoa: #4A3325;
  --t-ink: #3B2A1D;
  --t-line: rgba(59,42,29,.14);
  --t-display: var(--t-display-font), Georgia, 'Times New Roman', serif;
  --t-body: var(--t-body-font), system-ui, -apple-system, sans-serif;

  font-family: var(--t-body);
  color: var(--t-ink);
  background: var(--t-cream);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  /* Сайтът е светъл по дизайн — без автоматично потъмняване от браузъра. */
  color-scheme: only light;
}
.t-site *, .t-site *::before, .t-site *::after { box-sizing: border-box; }
/* :where() има нулева специфичност — иначе .t-site ul бие класовете по-долу
   и всеки margin-top по списъците мълчаливо се занулява. */
.t-site :where(p, h1, h2, h3, ul, dl, dd, figure) { margin: 0; }
.t-site ul { list-style: none; padding: 0; }
.t-site a { color: inherit; text-decoration: none; }
.t-site img { max-width: 100%; }
.t-site :focus-visible { outline: 2px solid var(--t-gold); outline-offset: 3px; }

.t-wrap { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 clamp(1.1rem, 4vw, 2.5rem); }

/* Изплуване при скрол — скритото състояние се включва само от JS. */
[data-t-reveal="on"] .t-site [data-reveal] { opacity: 0; transform: translateY(26px); }
.t-site [data-reveal] { transition: opacity .85s cubic-bezier(.22,.7,.3,1), transform .85s cubic-bezier(.22,.7,.3,1); }
.t-site [data-reveal][data-v="1"] { opacity: 1; transform: none; }

/* Вълни */
.t-wave { display: block; width: 100%; height: clamp(46px, 7vw, 96px); }
.t-wave-bottom { position: absolute; left: 0; right: 0; bottom: -1px; }

/* ── Типография ─────────────────────────────────────────── */
.t-eyebrow {
  font-size: .74rem; font-weight: 700; letter-spacing: .22em; text-transform: uppercase;
  color: var(--t-gold-deep); margin-bottom: 1rem;
}
.t-eyebrow.light { color: var(--t-champagne); }
.t-h2 {
  font-family: var(--t-display); font-weight: 400; line-height: 1.12;
  font-size: clamp(2rem, 4.4vw, 3.3rem); letter-spacing: -.01em; color: var(--t-ink);
}
.t-h2 em {
  font-style: normal;
  background: linear-gradient(100deg, var(--t-gold-deep), var(--t-gold) 45%, #D9AE62);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.t-h2.light { color: var(--t-cream); }
.t-sec-head { max-width: 56ch; margin-bottom: clamp(2rem, 5vw, 3.4rem); }
.t-sec-lead { margin-top: 1rem; font-size: 1.02rem; line-height: 1.75; color: var(--t-cocoa); opacity: .82; }
.t-empty { font-size: 1rem; line-height: 1.7; color: var(--t-cocoa); opacity: .8; }

.t-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 52px; padding: .95rem 2rem; border-radius: 4px;
  font-size: .98rem; font-weight: 700; letter-spacing: .03em;
  color: #fff; background: linear-gradient(120deg, var(--t-gold-deep), var(--t-gold) 55%, #D6A75A);
  box-shadow: 0 14px 28px -16px rgba(150,104,42,.95);
  transition: transform .2s ease, filter .2s ease;
}
.t-btn:hover { transform: translateY(-2px); filter: brightness(1.06); }
.t-btn.ghost { background: transparent; color: var(--t-ink); border: 1.5px solid var(--t-line); box-shadow: none; }
.t-btn.ghost:hover { border-color: var(--t-gold); }
.t-btn.small { min-height: 46px; padding: .7rem 1.5rem; font-size: .9rem; margin-top: 1.6rem; }

/* ── Навигация ──────────────────────────────────────────── */
.t-nav {
  position: sticky; top: 0; z-index: 60;
  background: rgba(253,250,244,.86); backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent; transition: border-color .25s ease, background .25s ease;
}
.t-nav.scrolled { border-bottom-color: var(--t-line); background: rgba(253,250,244,.96); }
.t-nav-inner {
  width: 100%; max-width: 1180px; margin: 0 auto; padding: .7rem clamp(1.1rem, 4vw, 2.5rem);
  display: flex; align-items: center; gap: 1.4rem;
}
.t-nav-brand { display: flex; align-items: center; gap: .6rem; margin-right: auto; min-width: 0; }
.t-nav-brand-mark {
  width: 38px; height: 38px; flex: none; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--t-display); font-size: 1.15rem; color: #fff;
  background: linear-gradient(135deg, var(--t-gold-deep), #D9AE62);
}
.t-nav-brand-text {
  font-family: var(--t-display); font-size: clamp(.98rem, 2.6vw, 1.22rem); line-height: 1.15;
  color: var(--t-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.t-nav-links { display: flex; gap: 1.7rem; }
.t-nav-links a { font-size: .92rem; font-weight: 500; color: var(--t-cocoa); transition: color .18s ease; }
.t-nav-links a:hover { color: var(--t-gold-deep); }
.t-nav-actions { display: flex; align-items: center; gap: 1rem; }
.t-nav-phone { font-size: .92rem; font-weight: 600; color: var(--t-ink); white-space: nowrap; }
.t-nav-cta {
  display: inline-flex; align-items: center; min-height: 44px; padding: .6rem 1.4rem; border-radius: 4px;
  font-size: .88rem; font-weight: 700; color: #fff;
  background: linear-gradient(120deg, var(--t-gold-deep), var(--t-gold));
}
.t-burger {
  display: none; width: 46px; height: 46px; flex: none; padding: 0;
  background: transparent; border: 0; cursor: pointer;
  flex-direction: column; align-items: center; justify-content: center; gap: 6px;
}
.t-burger span { display: block; width: 24px; height: 2px; background: var(--t-ink); transition: transform .25s ease, opacity .25s ease; }
.t-burger span.on:first-child { transform: translateY(4px) rotate(45deg); }
.t-burger span.on:last-child { transform: translateY(-4px) rotate(-45deg); }

/* Покрива целия екран; хедърът (z-index 60) остава отгоре. */
.t-mobile {
  position: fixed; inset: 0; z-index: 59; background: var(--t-cream);
  padding: 5.5rem clamp(1.1rem, 5vw, 2rem) 2rem;
  overflow-y: auto; overscroll-behavior: contain;
}
.t-mobile nav { display: flex; flex-direction: column; gap: .4rem; }
.t-mobile nav a {
  font-family: var(--t-display); font-size: 1.6rem; color: var(--t-ink);
  padding: .7rem 0; border-bottom: 1px solid var(--t-line);
}
.t-mobile-cta {
  margin-top: 1.4rem; border-bottom: 0 !important; text-align: center; border-radius: 4px;
  color: #fff !important; background: linear-gradient(120deg, var(--t-gold-deep), var(--t-gold));
  font-size: 1.15rem !important; padding: 1rem !important;
}
.t-mobile-phone { border-bottom: 0 !important; text-align: center; font-size: 1.1rem !important; color: var(--t-gold-deep) !important; }

/* ── Hero ───────────────────────────────────────────────── */
.t-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(155deg, #FFFDF8 0%, var(--t-sand) 48%, #F2E4CE 100%);
  padding: clamp(3rem, 7vw, 6rem) 0 clamp(6rem, 11vw, 10rem);
}
.t-hero-glow {
  position: absolute; top: -22%; right: -12%; width: 62vw; height: 62vw; max-width: 780px; max-height: 780px;
  background: radial-gradient(circle, rgba(232,210,166,.75) 0%, rgba(232,210,166,0) 68%);
  animation: t-drift 16s ease-in-out infinite alternate; pointer-events: none;
}
@keyframes t-drift {
  from { transform: translate3d(0,0,0) scale(1); }
  to   { transform: translate3d(-4%, 5%, 0) scale(1.1); }
}
.t-hero-inner {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
  gap: clamp(2rem, 5vw, 4rem); align-items: center;
}
.t-hero-title {
  font-family: var(--t-display); font-weight: 400; letter-spacing: -.015em;
  font-size: clamp(2.5rem, 6.4vw, 4.6rem); line-height: 1.06; margin-bottom: 1.5rem;
}
.t-hero-title em {
  font-style: normal;
  background: linear-gradient(100deg, var(--t-gold-deep), var(--t-gold) 42%, #DFB771);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.t-hero-lead { font-size: clamp(1rem, 1.5vw, 1.1rem); line-height: 1.8; color: var(--t-cocoa); max-width: 46ch; }
.t-hero-cta { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 2rem; }
.t-hero-facts { display: flex; flex-wrap: wrap; gap: 2.2rem; margin-top: 2.6rem; }
.t-hero-facts dt { font-size: .72rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--t-gold-deep); margin-bottom: .3rem; }
.t-hero-facts dd { font-size: 1rem; font-weight: 600; }

.t-hero-photo {
  position: relative; aspect-ratio: 3 / 4; width: 100%;
  border-radius: 260px 260px 8px 8px; overflow: hidden;
  box-shadow: 0 40px 70px -40px rgba(74,51,37,.6);
}
.t-hero-img { object-fit: cover; }
.t-hero-frame {
  position: absolute; inset: 14px; border: 1px solid rgba(253,250,244,.45);
  border-radius: 246px 246px 4px 4px; pointer-events: none;
}

/* ── Лента с факти ──────────────────────────────────────── */
.t-ribbon { position: relative; background: var(--t-cocoa); color: var(--t-cream); padding: clamp(2.6rem, 6vw, 4rem) 0 clamp(4.5rem, 9vw, 7rem); }
.t-ribbon-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(1.4rem, 3vw, 2.6rem); }
.t-ribbon-grid > div { display: flex; flex-direction: column; gap: .45rem; padding-left: 1rem; border-left: 2px solid rgba(232,210,166,.4); }
.t-ribbon-k { font-family: var(--t-display); font-size: 1.12rem; color: var(--t-champagne); line-height: 1.3; }
.t-ribbon-v { font-size: .92rem; line-height: 1.6; color: rgba(253,250,244,.78); }

/* ── За мен ─────────────────────────────────────────────── */
.t-about { position: relative; background: var(--t-cream); padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(5rem, 10vw, 8rem); }
.t-about-img { display: block; width: 100%; height: auto; }

/* Голямата снимка — на цялата ширина на съдържанието. */
.t-about-hero {
  position: relative; border-radius: 8px; overflow: hidden;
  margin-bottom: clamp(2rem, 5vw, 3.5rem);
  box-shadow: 0 40px 70px -44px rgba(74,51,37,.7);
}
.t-about-years {
  position: absolute; right: clamp(1rem, 3vw, 2rem); bottom: clamp(1rem, 3vw, 2rem);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: clamp(84px, 12vw, 124px); aspect-ratio: 1; border-radius: 50%;
  background: linear-gradient(135deg, rgba(150,104,42,.96), rgba(217,174,98,.96));
  color: #fff; box-shadow: 0 18px 36px -16px rgba(74,51,37,.8);
}
.t-about-years b { font-family: var(--t-display); font-weight: 400; font-size: clamp(1.9rem, 3.4vw, 2.7rem); line-height: 1; }
.t-about-years i { font-style: normal; font-size: clamp(.62rem, 1.1vw, .74rem); letter-spacing: .16em; text-transform: uppercase; margin-top: .2rem; }

.t-about-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr); gap: clamp(2rem, 5vw, 4rem); align-items: start; }
.t-about-copy p { font-size: 1.05rem; line-height: 1.9; color: var(--t-cocoa); margin-top: 1.3rem; }
.t-about-copy .t-h2 { margin-bottom: .4rem; }
.t-about-sign {
  font-family: var(--t-display); font-size: clamp(1.15rem, 2vw, 1.45rem);
  color: var(--t-gold-deep); line-height: 1.5; margin-top: 1.8rem !important;
  padding-top: 1.4rem; border-top: 1px solid var(--t-line);
}
.t-about-copy .t-btn { margin-top: 1.8rem; }
.t-about-side { display: grid; gap: clamp(.9rem, 2vw, 1.3rem); }
.t-about-shot { border-radius: 6px; overflow: hidden; background: var(--t-sand); box-shadow: 0 24px 46px -30px rgba(74,51,37,.6); }
/* Сертификатът е висок портрет — изрязваме го, за да не заема цял екран. */
.t-about-shot .t-about-img { aspect-ratio: 4 / 5; object-fit: cover; object-position: 50% 30%; }
.t-about-shot figcaption {
  padding: .8rem 1rem 1rem; font-size: .82rem; line-height: 1.5;
  color: var(--t-cocoa); opacity: .8;
}

/* ── Обучения ───────────────────────────────────────────── */
.t-train { position: relative; background: var(--t-sand); padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(5rem, 10vw, 8rem); }
.t-train-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(1.2rem, 3vw, 2.2rem); align-items: start; }
.t-train-item {
  align-self: start; padding: clamp(1rem, 2.4vw, 1.5rem);
  background: var(--t-cream); border: 1px solid var(--t-line); border-radius: 6px;
}
.t-train-name {
  font-family: var(--t-display); font-weight: 400; font-size: clamp(1.15rem, 2.2vw, 1.5rem);
  color: var(--t-gold-deep); letter-spacing: .02em; margin-bottom: .5rem;
}
.t-train-note { font-size: .96rem; line-height: 1.7; color: var(--t-cocoa); }

/* Трите снимки от обученията — един ред. */
.t-train-shots { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(.8rem, 2vw, 1.4rem); margin-top: clamp(2rem, 4.5vw, 3.4rem); }
.t-train-shots li { border-radius: 6px; overflow: hidden; box-shadow: 0 24px 46px -32px rgba(74,51,37,.6); }
.t-train-img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 4; object-fit: cover; object-position: 50% 30%; }

/* ── Марки в салона ─────────────────────────────────────── */
.t-brands { position: relative; background: var(--t-cocoa); padding: clamp(3rem, 7vw, 4.5rem) 0 clamp(5rem, 10vw, 8rem); }
.t-brands-head { max-width: 60ch; margin-bottom: clamp(2rem, 4vw, 3rem); }
.t-brands-lead { margin-top: 1rem; font-size: 1.02rem; line-height: 1.8; color: rgba(253,250,244,.8); }
.t-brand-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(1.2rem, 3vw, 2.4rem); }
.t-brand-row li {
  display: flex; flex-direction: column; gap: .5rem;
  padding-top: 1.1rem; border-top: 2px solid var(--t-champagne);
}
.t-brand-name {
  font-family: var(--t-display); font-size: clamp(1.05rem, 1.9vw, 1.35rem);
  line-height: 1.25; color: var(--t-champagne); letter-spacing: .01em;
}
.t-brand-note { font-size: .9rem; line-height: 1.6; color: rgba(253,250,244,.72); }

/* ── Ценоразпис ─────────────────────────────────────────── */
.t-prices { position: relative; background: var(--t-sand); padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(5rem, 10vw, 8rem); }
.t-price-cols { columns: 2; column-gap: clamp(2rem, 5vw, 4rem); }
.t-price-group { break-inside: avoid; margin-bottom: 2.6rem; }
.t-price-cat {
  font-family: var(--t-display); font-weight: 400; font-size: 1.5rem; color: var(--t-ink);
  padding-bottom: .6rem; margin-bottom: .9rem; border-bottom: 2px solid var(--t-champagne);
}
.t-price-list { display: flex; flex-direction: column; }
.t-price-row { display: flex; align-items: baseline; gap: .5rem; padding: .55rem 0; }
.t-price-name { font-size: .98rem; line-height: 1.45; color: var(--t-ink); }
.t-price-name em { font-style: normal; font-size: .84rem; color: var(--t-cocoa); opacity: .6; }
.t-price-dots { flex: 1 1 auto; min-width: 1.2rem; border-bottom: 1px dotted rgba(74,51,37,.4); transform: translateY(-.25em); }
.t-price-val { flex: none; text-align: right; display: flex; flex-direction: column; line-height: 1.25; }
.t-price-val strong { font-size: 1rem; font-weight: 700; color: var(--t-gold-deep); white-space: nowrap; }
.t-price-val em { font-style: normal; font-size: .76rem; color: var(--t-cocoa); opacity: .6; white-space: nowrap; }

.t-request { margin-top: 1.4rem; padding: clamp(1.6rem, 4vw, 2.6rem); background: var(--t-cream); border: 1px solid var(--t-line); border-radius: 6px; }
.t-request-lead { margin-top: .6rem; font-size: 1rem; line-height: 1.75; color: var(--t-cocoa); max-width: 62ch; }
.t-request-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem 2rem; margin-top: 1.6rem; }
.t-request-list li { display: flex; flex-direction: column; gap: .25rem; padding-top: .8rem; border-top: 1px solid var(--t-line); }
.t-request-list strong { font-size: 1rem; font-weight: 600; }
.t-request-list span { font-size: .88rem; line-height: 1.55; color: var(--t-cocoa); opacity: .78; }

.t-prices-cta { display: flex; justify-content: center; margin-top: 2.6rem; }

/* ── Преди / след ───────────────────────────────────────── */
.t-ba { position: relative; background: var(--t-cream); padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(5rem, 10vw, 8rem); }
.t-ba-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: clamp(1.4rem, 3vw, 2.4rem); }
.t-ba-card { background: var(--t-sand); border-radius: 6px; padding: clamp(1rem, 2.5vw, 1.4rem); }
.t-ba-pair { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
.t-ba-shot { position: relative; border-radius: 4px; overflow: hidden; }
/* Изходните снимки са с различни съотношения — изравняваме ги, за да не е ръбата секцията. */
.t-ba-img { display: block; width: 100%; height: 100%; aspect-ratio: 3 / 4; object-fit: cover; }
.t-ba-shot span {
  position: absolute; left: .5rem; bottom: .5rem; padding: .25rem .6rem; border-radius: 3px;
  font-size: .7rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  background: rgba(59,42,29,.78); color: var(--t-cream);
}
.t-ba-shot span.after { background: linear-gradient(120deg, var(--t-gold-deep), var(--t-gold)); }
.t-ba-card figcaption { display: flex; flex-direction: column; gap: .2rem; margin-top: 1rem; }
.t-ba-card figcaption strong { font-family: var(--t-display); font-weight: 400; font-size: 1.25rem; }
.t-ba-card figcaption span { font-size: .9rem; color: var(--t-cocoa); opacity: .78; }

/* ── Галерия ────────────────────────────────────────────── */
.t-gallery { position: relative; background: var(--t-sand); padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(5rem, 10vw, 8rem); }
.t-gal { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: clamp(.6rem, 1.6vw, 1rem); }
.t-gal-item { border-radius: 5px; overflow: hidden; }
.t-gal-item button { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
.t-gal-img { display: block; width: 100%; height: 100%; aspect-ratio: 3 / 4; object-fit: cover; transition: transform .5s cubic-bezier(.2,.7,.3,1); }
.t-gal-item:hover .t-gal-img { transform: scale(1.05); }

.t-lb {
  position: fixed; inset: 0; z-index: 100; background: rgba(43,29,20,.93);
  display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem;
}
.t-lb-fig { max-width: min(700px, 92vw); max-height: 88vh; display: flex; flex-direction: column; gap: .8rem; }
.t-lb-img { display: block; width: 100%; height: auto; max-height: 78vh; object-fit: contain; border-radius: 4px; }
.t-lb-fig figcaption { font-size: .88rem; color: rgba(253,250,244,.75); text-align: center; line-height: 1.5; }
.t-lb-close {
  position: absolute; top: 1rem; right: 1rem; width: 46px; height: 46px; border-radius: 50%;
  background: rgba(253,250,244,.14); color: var(--t-cream); border: 0; font-size: 1.7rem; line-height: 1; cursor: pointer;
}
.t-lb-nav {
  width: 48px; height: 48px; flex: none; border-radius: 50%; border: 0; cursor: pointer;
  background: rgba(253,250,244,.14); color: var(--t-cream); font-size: 2rem; line-height: 1;
}
.t-lb-nav:hover, .t-lb-close:hover { background: rgba(253,250,244,.26); }

/* ── Резервация ─────────────────────────────────────────── */
.t-book { position: relative; background: var(--t-cocoa); padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(5rem, 10vw, 8rem); }
.t-book-grid { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: clamp(2rem, 5vw, 4rem); align-items: start; }
.t-book-intro p { margin-top: 1.3rem; font-size: 1.02rem; line-height: 1.8; color: rgba(253,250,244,.82); max-width: 42ch; }
.t-book-hours { margin-top: 2.2rem; display: flex; flex-direction: column; }
.t-book-hours li {
  display: flex; justify-content: space-between; gap: 1rem; padding: .58rem 0;
  border-bottom: 1px solid rgba(232,210,166,.2); font-size: .95rem; color: var(--t-cream);
}
.t-book-hours li.off { color: rgba(253,250,244,.45); }
.t-book-hours li span:last-child { color: var(--t-champagne); font-weight: 600; }
.t-book-hours li.off span:last-child { color: rgba(253,250,244,.4); font-weight: 400; }
.t-book-panel { min-width: 0; background: var(--t-cream); border-radius: 8px; padding: clamp(1.3rem, 3.5vw, 2.4rem); box-shadow: 0 40px 70px -40px rgba(0,0,0,.6); }
.t-book-intro { min-width: 0; }

/* ── Контакти ───────────────────────────────────────────── */
.t-contact { background: var(--t-cream); padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(3rem, 6vw, 5rem); }
.t-contact-grid { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(2rem, 5vw, 4rem); align-items: start; }
.t-contact-list { margin-top: 2rem; display: flex; flex-direction: column; }
.t-contact-list > div { padding: 1rem 0; border-bottom: 1px solid var(--t-line); }
.t-contact-list dt { font-size: .72rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--t-gold-deep); margin-bottom: .35rem; }
.t-contact-list dd { font-size: 1rem; line-height: 1.65; color: var(--t-ink); }
.t-contact-list dd a:hover { color: var(--t-gold-deep); }
.t-social { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 1.8rem; }
.t-social a {
  display: inline-flex; align-items: center; min-height: 44px; padding: .6rem 1.3rem;
  border: 1.5px solid var(--t-line); border-radius: 4px; font-size: .9rem; font-weight: 600;
  transition: border-color .18s ease, color .18s ease;
}
.t-social a:hover { border-color: var(--t-gold); color: var(--t-gold-deep); }
.t-social-fb { gap: .6rem; border-color: rgba(24,119,242,.35) !important; color: #1877F2 !important; }
.t-social-fb:hover { border-color: #1877F2 !important; background: rgba(24,119,242,.07); }
.t-social-ico { width: 22px; height: 22px; flex: none; }
.t-social-fb span { color: var(--t-ink); }
.t-social-fb:hover span { color: #1877F2; }
.t-social-ig { gap: .6rem; border-color: rgba(193,53,132,.35) !important; color: #C13584 !important; }
.t-social-ig:hover { border-color: #C13584 !important; background: rgba(193,53,132,.07); }
.t-social-ig span { color: var(--t-ink); }
.t-social-ig:hover span { color: #C13584; }
.t-map { border-radius: 6px; overflow: hidden; border: 1px solid var(--t-line); background: var(--t-sand); }
.t-map iframe { display: block; width: 100%; height: clamp(300px, 46vw, 430px); border: 0; }

/* ── Футър ──────────────────────────────────────────────── */
.t-footer { background: var(--t-ink); color: var(--t-cream); padding: clamp(2.4rem, 5vw, 3.4rem) 0; }
.t-footer-inner { display: flex; flex-wrap: wrap; gap: 1.4rem 2.4rem; align-items: center; justify-content: space-between; }
.t-footer-brand { font-family: var(--t-display); font-size: 1.35rem; }
.t-footer-addr { font-size: .9rem; color: rgba(253,250,244,.65); margin-top: .3rem; }
.t-footer-nav { display: flex; flex-wrap: wrap; gap: 1.3rem; }
.t-footer-nav a { font-size: .9rem; color: rgba(253,250,244,.78); }
.t-footer-nav a:hover { color: var(--t-champagne); }
.t-footer-fb {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; margin: -10px 0; border-radius: 50%;
  color: rgba(253,250,244,.78); transition: color .18s ease, background .18s ease;
}
.t-footer-fb:hover { color: #fff; background: #1877F2; }
.t-footer-ig:hover { background: #C13584; }
.t-footer-fb-ico { width: 22px; height: 22px; }
.t-footer-note { width: 100%; padding-top: 1.4rem; border-top: 1px solid rgba(253,250,244,.14); font-size: .82rem; color: rgba(253,250,244,.55); }
.t-footer-note a { color: var(--t-champagne); }

/* ── Мобилна лента ──────────────────────────────────────── */
.t-sticky { display: none; }

/* ── Адаптивност ────────────────────────────────────────── */
@media (max-width: 1000px) {
  .t-nav-links, .t-nav-phone { display: none; }
  .t-burger { display: flex; }
  .t-nav-cta { display: none; }
  /* minmax(0, 1fr), не 1fr — иначе лентата с дати вдига min-content на колоната. */
  .t-hero-inner { grid-template-columns: minmax(0, 1fr); }
  .t-hero-photo { order: -1; max-width: 420px; margin: 0 auto 1.6rem; aspect-ratio: 4 / 5; }
  .t-about-grid, .t-book-grid, .t-contact-grid { grid-template-columns: minmax(0, 1fr); }
  .t-about-side { grid-template-columns: 1fr 1fr; align-items: start; }
  .t-ribbon-grid, .t-brand-row, .t-train-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .t-price-cols { columns: 1; }
}

@media (max-width: 640px) {
  .t-site { font-size: 16px; }

  /* Четимост и удобни за палец цели на мобилни. */
  .t-price-name, .t-book-hours li, .t-ribbon-v, .t-request-list span { font-size: 1rem; }
  .t-price-val em { font-size: .85rem; }
  .t-eyebrow { font-size: .8rem; }
  .t-brand-note, .t-ba-card figcaption span { font-size: .95rem; }

  /* Hero-то не бива да изяжда целия първи екран — заглавието трябва да се вижда. */
  .t-hero-photo { max-width: 300px; aspect-ratio: 1 / 1; margin-bottom: 1.2rem; }
  .t-hero-title { font-size: clamp(2.3rem, 11vw, 3rem); margin-bottom: 1.1rem; }
  .t-hero-cta { margin-top: 1.4rem; }
  .t-hero-facts { margin-top: 1.8rem; }
  .t-nav-brand { min-height: 44px; }
  .t-hero-facts dd a, .t-contact-list dd a, .t-footer-nav a {
    display: inline-flex; align-items: center; min-height: 44px;
  }
  .t-footer-note a { display: inline-block; padding: .4rem 0; }

  .t-hero { padding-top: 2rem; }
  .t-hero-facts { gap: 1.6rem; }
  .t-ribbon-grid, .t-brand-row, .t-train-list { grid-template-columns: 1fr; }
  .t-about-side { grid-template-columns: 1fr; }
  /* Три снимки в един ред стават по ~107px на телефон — не се вижда нищо.
     Затова на мобилно се редят една под друга, в цяла ширина. */
  .t-train-shots { grid-template-columns: 1fr; }
  .t-train-img { aspect-ratio: 4 / 3; object-position: 50% 28%; }
  .t-gal { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .t-lb { padding: .6rem; gap: .3rem; }
  .t-lb-nav { width: 44px; height: 44px; font-size: 1.6rem; }
  .t-footer-inner { flex-direction: column; align-items: flex-start; }

  /* Лентата се показва само на мобилни и се скрива над формата за резервация. */
  .t-sticky {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 55;
    display: flex; gap: .6rem; padding: .6rem clamp(.8rem, 4vw, 1.2rem) calc(.6rem + env(safe-area-inset-bottom));
    background: rgba(253,250,244,.95); backdrop-filter: blur(10px); border-top: 1px solid var(--t-line);
    transition: transform .3s ease, opacity .3s ease;
  }
  .t-sticky a { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 4px; font-size: .95rem; font-weight: 700; }
  .t-sticky-call { flex: 0 0 38%; border: 1.5px solid var(--t-line); color: var(--t-ink); }
  .t-sticky-cta { flex: 1 1 auto; color: #fff; background: linear-gradient(120deg, var(--t-gold-deep), var(--t-gold)); }
  [data-t-hide-sticky="on"] .t-sticky { transform: translateY(110%); opacity: 0; pointer-events: none; }

  /* Лентата не бива да покрива съдържание — футърът получава отстъп. */
  .t-footer { padding-bottom: calc(clamp(2.4rem, 5vw, 3.4rem) + 76px); }
}

/*
  Тъмен режим на телефона.
  Samsung Internet и Chrome „force dark" пренебрегват само color-scheme и
  инвертират цветовете алгоритмично — златният градиент на заглавията изчезваше,
  а бутоните ставаха почти черни. Щом страницата ЯВНО отговори на
  prefers-color-scheme: dark, браузърът спира да я пипа. Затова тук повтаряме
  същите светли стойности: сайтът остава един и същ на всяко устройство.
*/
@media (prefers-color-scheme: dark) {
  .t-site {
    color-scheme: only light;
    --t-cream: #FDFAF4;
    --t-sand: #F7EFE2;
    --t-champagne: #E8D2A6;
    --t-gold: #B9863C;
    --t-gold-deep: #96682A;
    --t-cocoa: #4A3325;
    --t-ink: #3B2A1D;
    --t-line: rgba(59,42,29,.14);
    background: #FDFAF4;
    color: #3B2A1D;
  }
  .t-nav { background: rgba(253,250,244,.96); }
  .t-mobile, .t-book-panel, .t-request, .t-about-shot { background: #FDFAF4; }
  .t-hero { background: linear-gradient(155deg, #FFFDF8 0%, #F7EFE2 48%, #F2E4CE 100%); }
  .t-ribbon, .t-book, .t-brands { background: #4A3325; }
  .t-about, .t-ba, .t-contact { background: #FDFAF4; }
  .t-prices, .t-gallery, .t-train { background: #F7EFE2; }
  .t-footer { background: #3B2A1D; }
  .t-train-item { background: #FDFAF4; }
  .t-ba-card { background: #F7EFE2; }
  .tb-select, .tb-slot, .tb-date, .tb-field input { background: #fff; color: #3B2A1D; }
  .t-sticky { background: rgba(253,250,244,.95); }
}

@media (prefers-reduced-motion: reduce) {
  .t-site *, .t-site *::before, .t-site *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .t-site [data-reveal] { opacity: 1 !important; transform: none !important; }
}
`;
