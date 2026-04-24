"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
const SERVICE_ICONS = ["✂", "✦", "◈", "◇", "◉", "✧", "⬡", "◆"];

function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function ServiceRow({ service, index }: { service: Service; index: number }) {
  const icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
  return (
    <article className="svi">
      <span className="svii">{icon}</span>
      <div className="svib">
        <h3>{service.name}</h3>
        <span className="svf">
          {(service.price_eur ?? 0).toFixed(0)} € / {eurToBgn(service.price_eur ?? 0)} лв · {fmtDuration(service.duration_minutes ?? 0)}
        </span>
      </div>
    </article>
  );
}

export function Luxe2({ data }: { data: SalonData }) {
  const { tenant, gallery, workingHours } = data;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const gold = tenant.primary_color ?? "#B8973A";
  const bg = tenant.background_color ?? "#FAF7F2";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const flatServices = servicesFlatForPublic(data);

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  const tkHref = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);
  const hasSocial = Boolean(igHref || fbHref || tkHref);
  const hasGallery = gallery.length > 0;
  const hasAbout = tenant.about_text1 || tenant.about_text2;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Jost:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --gold:   var(--color-primary, ${gold});
          --gold-l: color-mix(in srgb, var(--color-primary, ${gold}) 70%, white);
          --gold-p: color-mix(in srgb, var(--color-primary, ${gold}) 12%, white);
          --cream:  var(--color-bg, ${bg});
          --dark:   #1A1714;
          --mid:    #4A4540;
          --muted:  #8A837A;
          --border: color-mix(in srgb, var(--color-primary, ${gold}) 30%, transparent);
          --bl:     rgba(0,0,0,.08);
          --serif:  var(--font-heading, 'Cormorant Garamond',Georgia,serif);
          --sans:   var(--font-body, 'Jost',system-ui,sans-serif);
          --max:    1200px;
          --side:   clamp(1rem,5vw,4rem)
        }
        /* Design token bridge — builder/postMessage updates --color-* and --font-* on #salon-design-root */
        #salon-design-root{
          --gold:   var(--color-primary, ${gold});
          --gold-l: color-mix(in srgb, var(--color-primary, ${gold}) 70%, white);
          --gold-p: color-mix(in srgb, var(--color-primary, ${gold}) 12%, white);
          --cream:  var(--color-bg, ${bg});
          --border: color-mix(in srgb, var(--color-primary, ${gold}) 30%, transparent);
          --serif:  var(--font-heading, 'Cormorant Garamond', Georgia, serif);
          --sans:   var(--font-body, 'Jost', system-ui, sans-serif);
        }
        html{scroll-behavior:smooth}
        body{font-family:var(--sans);font-weight:300;color:var(--dark);background:var(--cream);-webkit-font-smoothing:antialiased}
        .root{overflow-x:hidden}
        .cnt{max-width:var(--max);margin:0 auto;padding:0 var(--side)}
        h1,h2,h3{font-family:var(--serif);font-weight:400;line-height:1.15}
        em{font-style:italic;color:var(--gold)}
        a{color:inherit;text-decoration:none}
        .eyebrow{display:block;font-size:10px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
        .stitle{font-size:clamp(1.8rem,4vw,3rem);margin-bottom:12px}
        .ssub{color:var(--muted);font-size:1rem;max-width:560px;line-height:1.7}
        .shdr{text-align:center;margin-bottom:3.5rem}
        .shdr .ssub{margin:0 auto}
        .fade-up{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
        .fade-up.vis{opacity:1;transform:none}
        .btn-g{display:inline-flex;align-items:center;gap:6px;background:var(--gold);color:#fff;border:none;border-radius:2px;padding:11px 24px;font-family:var(--sans);font-size:11px;font-weight:400;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:.2s;text-decoration:none}
        .btn-g:hover{background:var(--gold-l);transform:translateY(-1px)}
        .btn-o{display:inline-flex;align-items:center;border:1px solid var(--gold);color:var(--gold);background:transparent;border-radius:2px;padding:11px 24px;font-family:var(--sans);font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:.2s;text-decoration:none}
        .btn-o:hover{background:var(--gold);color:#fff}
        /* ── HEADER ── */
        .hdr{position:fixed;top:0;left:0;right:0;z-index:100;transition:background .3s,box-shadow .3s}
        .hdr.scrolled{background:rgba(250,247,242,.97);box-shadow:0 1px 0 var(--border);backdrop-filter:blur(8px)}
        .hdr-in{max-width:var(--max);margin:0 auto;padding:1.5rem var(--side);display:flex;align-items:center;gap:2rem}
        .logo{display:flex;align-items:center;gap:8px;color:var(--dark)}
        .lm{color:var(--gold);font-size:14px}
        .lt{font-family:var(--serif);font-size:1.2rem}
        .dnav{display:flex;gap:2rem;margin-left:auto}
        .dnav a{color:var(--mid);font-size:10px;font-weight:400;letter-spacing:.1em;text-transform:uppercase;transition:.2s}
        .dnav a:hover{color:var(--gold)}
        .hcta{margin-left:1rem}
        .burger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px;margin-left:auto}
        .burger span{display:block;width:24px;height:1px;background:var(--dark)}
        .mnav{background:var(--cream);padding:1.5rem var(--side) 2rem;display:flex;flex-direction:column;gap:1.25rem;border-top:1px solid var(--border)}
        .mnav a{color:var(--dark);font-size:1.1rem;font-family:var(--serif)}
        /* ── HERO ── */
        .hero{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:8rem var(--side) 6rem;text-align:center;overflow:hidden}
        .hero-bg{position:absolute;inset:0;background:linear-gradient(180deg,#FAF7F2 0%,var(--gold-p) 100%);z-index:0}
        .hero-c{position:relative;z-index:1;max-width:700px}
        .hero h1{font-size:clamp(3rem,8vw,6.5rem);font-weight:300;margin-bottom:1.5rem}
        .hero p{font-size:clamp(1rem,2vw,1.15rem);color:var(--muted);line-height:1.7;margin-bottom:2.5rem}
        .hero-ctas{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
        .hscroll{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);color:var(--gold);font-size:1.2rem;animation:bounce 2s infinite;z-index:1}
        @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}
        /* ── ABOUT ── */
        .about{padding:6rem 0;background:#fff}
        .ag{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center}
        .aiw{position:relative}
        .ai{width:100%;aspect-ratio:3/4;background:var(--gold-p);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.9rem;overflow:hidden;position:relative}
        .ai img{width:100%;height:100%;object-fit:cover}
        .abadge{position:absolute;bottom:-1.5rem;right:-1.5rem;width:100px;height:100px;background:var(--gold);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
        .bn{font-family:var(--serif);font-size:2rem;line-height:1}
        .bt{font-size:10px;letter-spacing:.05em;text-align:center;opacity:.9}
        .atxt{display:flex;flex-direction:column;gap:1.25rem}
        .atxt p{color:var(--mid);line-height:1.8}
        .certs{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
        .cert{border:1px solid var(--border);color:var(--gold);font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:5px 12px}
        /* ── SERVICES ── */
        .services{padding:6rem 0;background:var(--cream)}
        .svl{display:flex;flex-direction:column}
        .spec-name{font-family:var(--serif);font-size:1.1rem;color:var(--mid);margin:2rem 0 .5rem;font-style:italic}
        .svi{display:flex;align-items:center;gap:1.5rem;padding:1.75rem 0;border-bottom:1px solid var(--bl)}
        .svi:first-of-type{border-top:1px solid var(--bl)}
        .svii{font-size:1.4rem;color:var(--gold);width:40px;flex-shrink:0;text-align:center}
        .svib{flex:1}
        .svib h3{font-family:var(--serif);font-size:1.3rem;font-weight:400;margin-bottom:4px}
        .svf{display:inline-block;font-size:12px;color:var(--gold);font-weight:400}
        /* ── WHY ── */
        .why{padding:6rem 0;background:var(--dark)}
        .wgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem}
        .wcard{padding:2rem;border:1px solid rgba(255,255,255,.1);display:flex;flex-direction:column;gap:1rem}
        .wi{font-size:1.5rem;color:var(--gold)}
        .wcard h3{font-family:var(--serif);font-size:1.2rem;font-weight:400;color:#fff}
        .wcard p{color:rgba(255,255,255,.55);font-size:.9rem;line-height:1.7}
        /* ── GALLERY ── */
        .gallery{padding:6rem 0;background:#fff}
        .ggrid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
        .gi{overflow:hidden}
        .gp{aspect-ratio:3/4;background:var(--gold-p);display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:1.5rem;transition:transform .4s;overflow:hidden;position:relative}
        .gp img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
        .gi:hover .gp img,.gi:hover .gp{transform:scale(1.03)}
        .gig{text-align:center;margin-top:2.5rem}
        /* ── BOOKING BANNER ── */
        .bkb{padding:5rem var(--side);background:var(--gold-p);text-align:center}
        .bkb h2{font-family:var(--serif);font-size:clamp(1.8rem,4vw,3rem);margin-bottom:1rem}
        .bkb p{color:var(--muted);margin-bottom:2rem;line-height:1.7}
        /* ── CONTACT ── */
        .contact{padding:6rem 0;background:var(--cream)}
        .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:start}
        .clist{display:flex;flex-direction:column;gap:1.5rem;margin:2rem 0}
        .crow{display:grid;grid-template-columns:120px 1fr;gap:1rem;padding-bottom:1.5rem;border-bottom:1px solid var(--bl)}
        .crow:last-child{border-bottom:none}
        .crow dt{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-top:2px}
        .crow dd{color:var(--dark);font-size:.95rem;line-height:1.6;display:flex;flex-direction:column;gap:3px}
        .crow dd a{color:var(--gold)}
        .crow dd span{color:var(--mid)}
        .socials{display:flex;gap:10px;flex-wrap:wrap}
        .sl{width:44px;height:44px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;color:var(--gold);transition:.2s;border-radius:2px}
        .sl:hover{background:var(--gold);color:#fff}
        .mwrap{}
        .mph{width:100%;aspect-ratio:4/3;background:var(--gold-p);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem;color:var(--muted);font-size:.9rem;overflow:hidden}
        .mph iframe{width:100%;height:100%;border:none}
        /* ── FOOTER ── */
        .footer{background:var(--dark);padding:3rem 0}
        .fin{display:flex;flex-direction:column;align-items:center;gap:2rem;text-align:center}
        .fb{display:flex;flex-direction:column;align-items:center;gap:8px}
        .fb .lm{color:var(--gold);font-size:1.3rem}
        .fb .lt{font-family:var(--serif);font-size:1.3rem;color:#fff}
        .ftag{font-size:10px;letter-spacing:.2em;color:rgba(255,255,255,.35);text-transform:uppercase}
        .fnav{display:flex;gap:2rem;flex-wrap:wrap;justify-content:center}
        .fnav a{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.45);transition:.2s}
        .fnav a:hover{color:var(--gold-l)}
        .fleg{font-size:10px;color:rgba(255,255,255,.25)}
        .fleg a{color:var(--gold-l)}
        /* ── RESPONSIVE ── */
        @media(max-width:1024px){.wgrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){
          .dnav,.hcta{display:none}.burger{display:flex}
          .ag{grid-template-columns:1fr;gap:3rem}.abadge{right:0}
          .ggrid{grid-template-columns:repeat(2,1fr)}
          .cgrid{grid-template-columns:1fr;gap:3rem}
          .wgrid{grid-template-columns:1fr}
        }
        @media(max-width:480px){.ggrid{grid-template-columns:1fr}.crow{grid-template-columns:1fr}}
      `}</style>

      <div className="root">
        {/* HEADER */}
        <header className={`hdr${scrolled ? " scrolled" : ""}`}>
          <div className="hdr-in">
            <a href="#hero" className="logo">
              <span className="lm">✦</span>
              <span className="lt">{tenant.salon_name}</span>
            </a>
            <nav className="dnav">
              {hasAbout && <a href="#about">За нас</a>}
              <a href="#services">Услуги</a>
              {hasGallery && <a href="#gallery">Галерия</a>}
              <a href="#contact">Контакти</a>
            </nav>
            <a href="#booking" className="btn-g hcta">Запишете час</a>
            <button className="burger" onClick={() => setMobileOpen(!mobileOpen)}>
              <span /><span /><span />
            </button>
          </div>
          {mobileOpen && (
            <nav className="mnav">
              {hasAbout && <a href="#about" onClick={() => setMobileOpen(false)}>За нас</a>}
              <a href="#services" onClick={() => setMobileOpen(false)}>Услуги</a>
              {hasGallery && <a href="#gallery" onClick={() => setMobileOpen(false)}>Галерия</a>}
              <a href="#contact" onClick={() => setMobileOpen(false)}>Контакти</a>
              <a href="#booking" className="btn-g">Запишете час ✦</a>
            </nav>
          )}
        </header>

        {/* HERO */}
        <section id="hero" className="hero">
          <div className="hero-bg" />
          <div className="hero-c">
            <span className="eyebrow">✦ {tenant.salon_name}</span>
            <h1>
              {tenant.hero_title ?? "Коса, която"}<br />
              <em>{tenant.hero_subtitle ?? "говори"}</em>
            </h1>
            <p>{tenant.description}</p>
            <div className="hero-ctas">
              <a href="#booking" className="btn-g">Запишете час</a>
              <a href="#services" className="btn-o">Разгледайте услугите</a>
            </div>
          </div>
          <div className="hscroll">↓</div>
        </section>

        {/* ABOUT */}
        {hasAbout && (
          <section id="about" className="about">
            <div className="cnt ag">
              <div className="aiw">
                <div className="ai">
                  {tenant.about_image_url ? (
                    <Image
                      src={tenant.about_image_url}
                      alt={tenant.salon_name}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  ) : (
                    <span>снимка</span>
                  )}
                </div>
                <div className="abadge">
                  <span className="bn">✦</span>
                  <span className="bt">Premium</span>
                </div>
              </div>
              <div className="atxt">
                <span className="eyebrow">За нас</span>
                <h2 className="stitle"><em>{tenant.salon_name}</em></h2>
                {tenant.about_text1 && <p>{tenant.about_text1}</p>}
                {tenant.about_text2 && <p>{tenant.about_text2}</p>}
              </div>
            </div>
          </section>
        )}

        {/* SERVICES */}
        <section id="services" className="services">
          <div className="cnt">
            <div className="shdr">
              <span className="eyebrow">Меню</span>
              <h2 className="stitle">Нашите <em>услуги</em></h2>
              <p className="ssub">Цените включват ДДС. Изберете услуга и запазете час онлайн.</p>
            </div>
            <div className="svl">
              {multi ? (
                specs.map((spec) => {
                  const specServices = servicesForSpecialist(data, spec.id);
                  return (
                    <div key={spec.id}>
                      <p className="spec-name">— {spec.name}</p>
                      {specServices.map((s, i) => (
                        <ServiceRow key={s.id} service={s} index={i} />
                      ))}
                    </div>
                  );
                })
              ) : (
                flatServices.map((s, i) => (
                  <ServiceRow key={s.id} service={s} index={i} />
                ))
              )}
            </div>
            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <Link href={`/${tenant.salon_slug}/booking`} className="btn-g">Запазете час ✦</Link>
            </div>
          </div>
        </section>

        {/* WHY US */}
        <section className="why">
          <div className="cnt">
            <div className="shdr">
              <span className="eyebrow" style={{ color: "var(--gold-l)" }}>Защо нас</span>
              <h2 className="stitle" style={{ color: "#fff" }}>Разлика, която <em>усещате</em></h2>
            </div>
            <div className="wgrid">
              {[
                { icon: "◈", title: "Индивидуален подход", desc: "Всяка коса е различна. Всяко посещение започва с консултация и анализ." },
                { icon: "◇", title: "Премиум продукти", desc: "Работим единствено с висококачествени продукти от водещи марки." },
                { icon: "✦", title: "Точност и уважение", desc: "Стартираме навреме. Вашето време е ценно — не го губим." },
                { icon: "◉", title: "Онлайн резервации", desc: "Запазете час 24/7 — с автоматично потвърждение и напомняне." },
              ].map((w) => (
                <div key={w.title} className="wcard">
                  <span className="wi">{w.icon}</span>
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GALLERY */}
        {hasGallery && (
          <section id="gallery" className="gallery">
            <div className="cnt">
              <div className="shdr">
                <span className="eyebrow">Портфолио</span>
                <h2 className="stitle">Нашата <em>работа</em></h2>
              </div>
              <div className="ggrid">
                {gallery.slice(0, 6).map((img, i) => (
                  <div key={i} className="gi">
                    <div className="gp">
                      <Image src={img.url} alt="" fill sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw" />
                    </div>
                  </div>
                ))}
              </div>
              {igHref && (
                <div className="gig">
                  <a href={igHref} target="_blank" rel="noopener noreferrer" className="btn-o">
                    Вижте повече в Instagram →
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* BOOKING */}
        <section id="booking" className="bkb">
          <div className="cnt">
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <span className="eyebrow">Онлайн записване</span>
              <h2 className="stitle">Запазете своя <em>час</em></h2>
              <p className="ssub" style={{ margin: "0 auto" }}>Попълнете формата и ще получите потвърждение скоро.</p>
            </div>
            <InlineBookingForm
              salonSlug={tenant.salon_slug}
              services={flatServices}
              primaryColor={gold}
              textColor="var(--dark)"
              bgColor="rgba(255,255,255,0.8)"
              isDemo={tenant.salon_slug.startsWith("demo/")}
            />
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="contact">
          <div className="cnt cgrid">
            <div className="cinfo">
              <span className="eyebrow">Контакти</span>
              <h2 className="stitle">Намерете <em>ни</em></h2>
              <dl className="clist">
                {tenant.address && (
                  <div className="crow">
                    <dt>Адрес</dt>
                    <dd>{tenant.address}</dd>
                  </div>
                )}
                {tenant.phone && (
                  <div className="crow">
                    <dt>Телефон</dt>
                    <dd><a href={`tel:${tenant.phone}`}>{tenant.phone}</a></dd>
                  </div>
                )}
                {tenant.email && (
                  <div className="crow">
                    <dt>Имейл</dt>
                    <dd><a href={`mailto:${tenant.email}`}>{tenant.email}</a></dd>
                  </div>
                )}
                {workingHours.length > 0 && (
                  <div className="crow">
                    <dt>Работно време</dt>
                    <dd>
                      {workingHours
                        .slice()
                        .sort((a, b) => a.day_of_week - b.day_of_week)
                        .map((h) => (
                          <span key={h.id}>
                            {DAY_LABELS[h.day_of_week]}: {h.is_day_off ? "почивен ден" : `${h.start_time} – ${h.end_time}`}
                          </span>
                        ))}
                    </dd>
                  </div>
                )}
              </dl>
              {hasSocial && (
                <div className="socials">
                  {igHref && <a href={igHref} target="_blank" rel="noopener noreferrer" className="sl">IG</a>}
                  {fbHref && <a href={fbHref} target="_blank" rel="noopener noreferrer" className="sl">FB</a>}
                  {tkHref && <a href={tkHref} target="_blank" rel="noopener noreferrer" className="sl">TK</a>}
                </div>
              )}
            </div>
            <div className="mwrap">
              <div className="mph">
                {mapsSrc
                  ? <iframe src={mapsSrc} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  : <span>Google Maps</span>
                }
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="cnt fin">
            <div className="fb">
              <span className="lm">✦</span>
              <span className="lt">{tenant.salon_name}</span>
              <p className="ftag">✦ {tenant.description?.split(".")[0] ?? tenant.salon_name} ✦</p>
            </div>
            <nav className="fnav">
              {hasAbout && <a href="#about">За нас</a>}
              <a href="#services">Услуги</a>
              {hasGallery && <a href="#gallery">Галерия</a>}
              <a href="#contact">Контакти</a>
              <Link href={`/${tenant.salon_slug}/booking`}>Резервирай</Link>
            </nav>
            <p className="fleg">© {new Date().getFullYear()} {tenant.salon_name}. Всички права запазени.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
