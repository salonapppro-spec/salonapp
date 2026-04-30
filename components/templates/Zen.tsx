"use client";

import { useEffect, useRef, useState } from "react";
import type { SalonData } from "@/types/database";
import type { Service } from "@/types/database";
import {
  activeSpecialists,
  servicesFlatForPublic,
  servicesForSpecialist,
  useSpecialistSectionsOnPublicSite,
} from "@/components/templates/salon-shared";
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

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("vis"); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function ServiceAccordion({ service, index }: { service: Service; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useFadeUp();
  return (
    <div ref={ref} className="fade-up acc-item">
      <button className="acc-header" onClick={() => setOpen((prev) => !prev)} type="button">
        <div className="acc-left">
          <span className="acc-num">0{index + 1}</span>
          <span className="acc-name">{service.name}</span>
        </div>
        <div className="acc-right">
          <span className="acc-dur">
            {service.is_complex ? "Времето се уточнява" : `${service.duration_minutes ?? 0} мин`}
          </span>
          <span className="acc-arrow">{open ? "−" : "+"}</span>
        </div>
      </button>
      {open && (
        <div className="acc-body">
          <div className="acc-prices">
            <div className="acc-price-row">
              <span>Цена</span>
              <span>{Number(service.price_eur).toFixed(0)} €</span>
            </div>
            <div className="acc-price-row">
              <span>≈ лева</span>
              <span>{eurToBgn(Number(service.price_eur))} лв</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Testimonial { quote: string; name: string; }
interface Product { name: string; subtitle: string; description: string; }

function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div className="tc-wrap">
      <div className="tc-inner">
        <div className="tc-quote-icon">"</div>
        <p className="tc-quote">{items[active].quote}</p>
        <p className="tc-name">— {items[active].name}</p>
        <div className="tc-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`tc-dot${i === active ? " tc-dot-on" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Отзив ${i + 1}`}
              type="button"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Zen({ data }: { data: SalonData }) {
  const { tenant, gallery } = data;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const primary = tenant.primary_color ?? "#C9A06A";
  const bg = tenant.background_color ?? "#FAF8F4";

  const tokens = (tenant.design_tokens ?? {}) as Record<string, unknown>;
  const testimonials = Array.isArray(tokens.testimonials) ? (tokens.testimonials as Testimonial[]) : [];
  const products = Array.isArray(tokens.products) ? (tokens.products as Product[]) : [];
  const productsLink = typeof tokens.products_link === "string" ? tokens.products_link : null;

  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const services = servicesFlatForPublic(data);

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  const tkHref = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);

  const phoneHref = tenant.phone ? `tel:${tenant.phone.replace(/\s/g, "")}` : null;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  function goTo(id: string) {
    setMobileOpen(false);
    document.body.style.overflow = "";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Nunito:wght@300;400;500&display=swap');

        :root {
          --beige:    var(--color-bg, ${bg});
          --beige-dk: ${bg}ee;
          --beige-bd: #D9D0BC;
          --green:    var(--color-primary, ${primary});
          --green-lt: color-mix(in srgb, var(--color-primary, ${primary}) 70%, white);
          --green-dk: color-mix(in srgb, var(--color-primary, ${primary}) 55%, black);
          --brown:    #8B6F5E;
          --text:     var(--color-text, #2A2A2A);
          --muted:    #888880;
          --white:    #FDFCF9;
          --serif:    var(--font-heading, 'Playfair Display', Georgia, serif);
          --sans:     var(--font-body, 'Nunito', sans-serif);
          --trans:    0.35s ease;
        }

        #salon-design-root {
          --green:    var(--color-primary, ${primary});
          --green-lt: color-mix(in srgb, var(--color-primary, ${primary}) 70%, white);
          --green-dk: color-mix(in srgb, var(--color-primary, ${primary}) 55%, black);
          --beige:    var(--color-bg, ${bg});
          --beige-dk: color-mix(in srgb, var(--color-bg, ${bg}) 93%, transparent);
          --text:     var(--color-text, #2A2A2A);
          --serif:    var(--font-heading, 'Playfair Display', Georgia, serif);
          --sans:     var(--font-body, 'Nunito', sans-serif);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--beige);
          color: var(--text);
          font-family: var(--sans);
          font-weight: 300;
          line-height: 1.75;
          overflow-x: hidden;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--beige); }
        ::-webkit-scrollbar-thumb { background: var(--beige-bd); }
        a { color: inherit; text-decoration: none; }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
        section { padding: 6rem 0; }

        .tag { font-size: .6rem; letter-spacing: .3em; text-transform: uppercase; color: var(--green); font-weight: 500; }
        .leaf-div { display: flex; align-items: center; gap: .8rem; margin: .8rem 0 1.5rem; }
        .leaf-div::before, .leaf-div::after { content: ''; flex: 1; height: 1px; background: var(--beige-bd); }
        .leaf-div span { color: var(--green); font-size: .9rem; }
        .leaf-center { justify-content: center; }
        .fade-up { opacity: 0; transform: translateY(22px); transition: opacity .7s ease, transform .7s ease; }
        .fade-up.vis { opacity: 1; transform: none; }

        /* NAV */
        .zen-navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.2rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: all var(--trans);
        }
        .zen-navbar.scrolled {
          background: rgba(250,248,244,.96);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--beige-bd);
        }
        .nav-logo { font-family: var(--serif); font-size: 1.4rem; color: var(--green-dk); cursor: pointer; }
        .nav-logo span { font-style: italic; color: var(--green); }
        .nav-links { display: flex; gap: 2.5rem; list-style: none; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
        .nav-links a { transition: color var(--trans); cursor: pointer; }
        .nav-links a:hover { color: var(--green); }
        .nav-btn {
          background: var(--green); color: var(--white); border: none;
          padding: .7rem 1.6rem; font-family: var(--sans);
          font-size: .7rem; font-weight: 500; letter-spacing: .12em;
          text-transform: uppercase; cursor: pointer;
          transition: background var(--trans); border-radius: 2px;
          text-decoration: none; display: inline-block;
        }
        .nav-btn:hover { background: var(--green-dk); }
        .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
        .hamburger span { display: block; width: 22px; height: 1px; background: var(--green); }

        .mobile-menu { display: none; position: fixed; inset: 0; z-index: 99; background: var(--beige); flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem; }
        .mobile-menu.open { display: flex; }
        .mobile-menu a { font-family: var(--serif); font-size: 2rem; color: var(--green-dk); cursor: pointer; transition: color var(--trans); }
        .mobile-menu a:hover { color: var(--green); }
        .mobile-close { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; font-size: 1.5rem; color: var(--muted); cursor: pointer; }

        /* HERO */
        .hero {
          min-height: 100svh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; position: relative;
          overflow: hidden; padding: 7rem 2rem 5rem;
          background: linear-gradient(160deg, var(--beige) 0%, var(--beige-dk) 100%);
        }
        .hero-circles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .hero-circle { position: absolute; border-radius: 50%; border: 1px solid var(--beige-bd); opacity: .4; top: 50%; left: 50%; transform: translate(-50%,-50%); }
        .c1 { width: 700px; height: 700px; }
        .c2 { width: 500px; height: 500px; }
        .c3 { width: 300px; height: 300px; }
        .hero-eyebrow { font-size: .6rem; letter-spacing: .35em; text-transform: uppercase; color: var(--green); margin-bottom: 2rem; position: relative; }
        .hero-title { font-family: var(--serif); font-size: clamp(3rem, 7vw, 6rem); font-weight: 400; line-height: 1.1; color: var(--green-dk); margin-bottom: 1.2rem; position: relative; }
        .hero-title em { font-style: italic; color: var(--green); }
        .hero-sub { font-size: .95rem; color: var(--muted); max-width: 460px; margin: 0 auto 3rem; line-height: 1.9; position: relative; }
        .hero-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative; }
        .btn-green {
          background: var(--green); color: var(--white); border: none;
          padding: .9rem 2.2rem; font-family: var(--sans);
          font-size: .75rem; font-weight: 500; letter-spacing: .12em;
          text-transform: uppercase; cursor: pointer;
          transition: background var(--trans); border-radius: 2px;
          text-decoration: none; display: inline-block;
        }
        .btn-green:hover { background: var(--green-dk); }
        .btn-outline {
          background: transparent; color: var(--green);
          border: 1px solid var(--green); padding: .9rem 2.2rem;
          font-family: var(--sans); font-size: .75rem;
          font-weight: 500; letter-spacing: .12em;
          text-transform: uppercase; cursor: pointer;
          transition: all var(--trans); border-radius: 2px;
          text-decoration: none; display: inline-block;
        }
        .btn-outline:hover { background: var(--green); color: var(--white); }

        /* ABOUT */
        .about { background: var(--white); padding: 0; }
        .about-inner { display: grid; grid-template-columns: 400px 1fr; min-height: 560px; }
        .about-img {
          background: var(--beige-dk);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .about-img-char { font-family: var(--serif); font-size: 6rem; color: var(--beige-bd); font-style: italic; }
        .about-img-tag { position: absolute; bottom: 2rem; left: 2rem; background: var(--green); color: var(--white); font-size: .58rem; letter-spacing: .2em; text-transform: uppercase; font-weight: 500; padding: .45rem .9rem; }
        .about-content { padding: 5rem 4rem; display: flex; flex-direction: column; justify-content: center; }
        .about-title { font-family: var(--serif); font-size: clamp(1.8rem, 3vw, 2.8rem); line-height: 1.2; color: var(--green-dk); margin-bottom: 1.5rem; }
        .about-title em { font-style: italic; color: var(--green); }
        .about-txt { font-size: .88rem; color: var(--muted); line-height: 2; margin-bottom: 1rem; }

        /* SERVICES ACCORDION */
        .services { background: var(--beige); }
        .services-hdr { text-align: center; margin-bottom: 3rem; }
        .section-title { font-family: var(--serif); font-size: clamp(2rem, 3.5vw, 3rem); color: var(--green-dk); }
        .section-title em { font-style: italic; color: var(--green); }
        .spec-section-title { font-family: var(--serif); font-size: 1.5rem; color: var(--green-dk); margin-bottom: 1.5rem; font-style: italic; }
        .acc-list { border: 1px solid var(--beige-bd); border-radius: 2px; overflow: hidden; }
        .acc-item { border-bottom: 1px solid var(--beige-bd); background: var(--white); }
        .acc-item:last-child { border-bottom: none; }
        .acc-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1.6rem 2rem; background: none; border: none; cursor: pointer; text-align: left; transition: background var(--trans); }
        .acc-header:hover { background: var(--beige); }
        .acc-left { display: flex; align-items: center; gap: 1.5rem; }
        .acc-num { font-family: var(--serif); font-size: 1rem; color: var(--beige-bd); font-style: italic; min-width: 28px; }
        .acc-name { font-family: var(--serif); font-size: 1.2rem; color: var(--green-dk); }
        .acc-right { display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0; }
        .acc-dur { font-size: .68rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
        .acc-arrow { font-size: 1.4rem; color: var(--green); width: 28px; text-align: center; line-height: 1; transition: transform var(--trans); }
        .acc-body { padding: 0 2rem 1.8rem 5rem; background: var(--beige-dk); }
        .acc-prices { display: flex; flex-direction: column; gap: 0; }
        .acc-price-row { display: flex; justify-content: space-between; font-size: .84rem; padding: .5rem 0; border-bottom: 1px solid var(--beige-bd); }
        .acc-price-row:last-child { border-bottom: none; }
        .acc-price-row span:first-child { color: var(--muted); }
        .acc-price-row span:last-child { color: var(--green-dk); font-weight: 500; }

        /* PRODUCTS */
        .products { background: var(--white); }
        .products-hdr { text-align: center; margin-bottom: 3rem; }
        .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem; }
        .product-card {
          border: 1px solid var(--beige-bd); padding: 2.5rem 2rem;
          display: flex; flex-direction: column; gap: 1rem;
          transition: transform var(--trans), box-shadow var(--trans);
          background: var(--beige); position: relative; overflow: hidden;
        }
        .product-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--green), transparent);
          opacity: 0; transition: opacity var(--trans);
        }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.06); }
        .product-card:hover::before { opacity: 1; }
        .product-num { font-family: var(--serif); font-size: 2.5rem; color: var(--beige-bd); font-style: italic; line-height: 1; }
        .product-name { font-family: var(--serif); font-size: 1.15rem; color: var(--green-dk); line-height: 1.3; }
        .product-subtitle { font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; color: var(--green); }
        .product-desc { font-size: .82rem; color: var(--muted); line-height: 1.9; flex: 1; }
        .products-cta { text-align: center; }

        /* TESTIMONIALS */
        .testimonials { background: var(--green-dk); padding: 7rem 0; overflow: hidden; position: relative; }
        .testimonials::before { content: '"'; position: absolute; font-family: var(--serif); font-size: 30vw; color: rgba(255,255,255,.03); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; line-height: 1; }
        .tc-wrap { max-width: 760px; margin: 0 auto; padding: 0 2rem; text-align: center; position: relative; }
        .tc-inner { position: relative; }
        .tc-quote-icon { font-family: var(--serif); font-size: 5rem; color: var(--green-lt); line-height: .5; margin-bottom: 1.5rem; opacity: .5; }
        .tc-quote { font-family: var(--serif); font-size: clamp(1.1rem, 2vw, 1.5rem); font-style: italic; color: var(--beige); line-height: 1.7; margin-bottom: 2rem; }
        .tc-name { font-size: .65rem; letter-spacing: .25em; text-transform: uppercase; color: var(--green-lt); margin-bottom: 2.5rem; }
        .tc-dots { display: flex; justify-content: center; gap: .6rem; }
        .tc-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.2); border: none; cursor: pointer; transition: background var(--trans), transform var(--trans); padding: 0; }
        .tc-dot-on { background: var(--green-lt); transform: scale(1.3); }
        .tc-hdr { text-align: center; margin-bottom: 3rem; }
        .tc-tag { font-size: .6rem; letter-spacing: .3em; text-transform: uppercase; color: rgba(250,248,244,.4); display: block; margin-bottom: .5rem; }
        .tc-title { font-family: var(--serif); font-size: clamp(1.8rem, 3vw, 2.8rem); color: var(--beige); }
        .tc-title em { font-style: italic; color: var(--green-lt); }

        /* PHONE CTA */
        .phone-cta { background: var(--beige-dk); padding: 7rem 0; text-align: center; border-top: 1px solid var(--beige-bd); }
        .phone-cta-title { font-family: var(--serif); font-size: clamp(2rem, 4vw, 3.2rem); color: var(--green-dk); margin-bottom: .8rem; }
        .phone-cta-title em { font-style: italic; color: var(--green); }
        .phone-cta-sub { font-size: .9rem; color: var(--muted); margin-bottom: 2.5rem; }
        .phone-cta-number {
          display: inline-flex; align-items: center; gap: .8rem;
          font-family: var(--serif); font-size: clamp(1.6rem, 3vw, 2.2rem);
          color: var(--green-dk); border: 1px solid var(--beige-bd);
          padding: 1rem 2.5rem; transition: all var(--trans); border-radius: 2px;
          text-decoration: none; margin-bottom: 1.5rem;
          background: var(--white);
        }
        .phone-cta-number:hover { border-color: var(--green); color: var(--green); box-shadow: 0 8px 24px rgba(0,0,0,.06); transform: translateY(-2px); }
        .phone-cta-note { font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }

        /* GALLERY */
        .gallery { background: var(--white); }
        .gallery-hdr { text-align: center; margin-bottom: 2.5rem; }
        .gallery-scroll-wrap { overflow-x: auto; padding-bottom: 1rem; scrollbar-width: thin; scrollbar-color: var(--beige-bd) transparent; }
        .gallery-scroll-wrap::-webkit-scrollbar { height: 3px; }
        .gallery-scroll-wrap::-webkit-scrollbar-thumb { background: var(--beige-bd); }
        .gallery-scroll { display: flex; gap: 1rem; width: max-content; padding: 0 1.5rem; }
        .g-item { width: 280px; height: 360px; flex-shrink: 0; background: var(--beige-dk); border: 1px solid var(--beige-bd); overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; font-family: var(--serif); font-size: 3rem; color: var(--beige-bd); font-style: italic; transition: transform var(--trans); cursor: pointer; border-radius: 2px; }
        .g-item:first-child { width: 320px; }
        .g-item:hover { transform: translateY(-4px); }
        .g-lbl { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(46,66,40,.7), transparent); color: var(--beige); font-family: var(--sans); font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; padding: 2rem 1rem .8rem; opacity: 0; transition: opacity var(--trans); }
        .g-item:hover .g-lbl { opacity: 1; }

        /* CONTACT */
        .contact { background: var(--beige-dk); }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
        .contact-title { font-family: var(--serif); font-size: clamp(1.8rem, 3vw, 2.8rem); color: var(--green-dk); margin-bottom: .5rem; }
        .contact-title em { font-style: italic; color: var(--green); }
        .contact-info { margin-top: 2rem; }
        .contact-row { display: flex; gap: 1rem; align-items: flex-start; padding: 1rem 0; border-bottom: 1px solid var(--beige-bd); }
        .contact-icon { color: var(--green); flex-shrink: 0; margin-top: 2px; }
        .contact-lbl { font-size: .58rem; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); margin-bottom: .2rem; }
        .contact-val { font-size: .88rem; color: var(--text); line-height: 1.7; }
        .contact-val a { transition: color var(--trans); }
        .contact-val a:hover { color: var(--green); }
        .hours-table { display: flex; flex-direction: column; gap: .3rem; margin-top: .4rem; }
        .hours-row { display: flex; justify-content: space-between; font-size: .82rem; }
        .hours-day { color: var(--muted); }
        .hours-time { color: var(--text); }
        .hours-closed { color: var(--beige-bd); }
        .map-wrap { border: 1px solid var(--beige-bd); aspect-ratio: 4/3; overflow: hidden; background: var(--beige); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .8rem; color: var(--muted); font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; }
        .map-wrap iframe { width: 100%; height: 100%; border: none; filter: sepia(20%) contrast(90%); }

        /* SOCIAL BAR */
        .social-bar { background: var(--white); border-top: 1px solid var(--beige-bd); border-bottom: 1px solid var(--beige-bd); padding: 1.8rem 0; }
        .social-bar-inner { display: flex; align-items: center; justify-content: center; gap: 2.5rem; }
        .social-link { display: flex; align-items: center; gap: .6rem; font-size: .68rem; letter-spacing: .15em; text-transform: uppercase; color: var(--muted); transition: color var(--trans); }
        .social-link:hover { color: var(--green); }
        .social-div { width: 1px; height: 18px; background: var(--beige-bd); }

        /* FOOTER */
        .zen-footer { background: var(--green-dk); padding: 3rem 0 2rem; text-align: center; }
        .footer-logo { font-family: var(--serif); font-size: 1.8rem; color: var(--beige); letter-spacing: .04em; margin-bottom: .4rem; }
        .footer-logo span { font-style: italic; color: var(--green-lt); }
        .footer-tag { font-size: .6rem; letter-spacing: .22em; text-transform: uppercase; color: rgba(245,240,232,.35); margin-bottom: 2rem; }
        .footer-nav { display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; font-size: .68rem; letter-spacing: .12em; text-transform: uppercase; color: rgba(245,240,232,.35); margin-bottom: 2rem; }
        .footer-nav a { transition: color var(--trans); cursor: pointer; }
        .footer-nav a:hover { color: var(--beige); }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,.08); padding-top: 1.5rem; font-size: .66rem; color: rgba(245,240,232,.25); display: flex; justify-content: center; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .dot { width: 3px; height: 3px; background: rgba(245,240,232,.2); border-radius: 50%; display: inline-block; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .about-inner { grid-template-columns: 1fr; }
          .about-img { min-height: 300px; }
          .contact-grid { grid-template-columns: 1fr; }
          .products-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          section { padding: 4rem 0; }
          .nav-links, .nav-btn { display: none; }
          .hamburger { display: flex; }
          .social-bar-inner { gap: 1.2rem; flex-wrap: wrap; }
          .social-div { display: none; }
          .about-content { padding: 3rem 1.5rem; }
          .zen-navbar { padding: 1.2rem; }
          .acc-body { padding: 0 1rem 1.5rem 1rem; }
          .products-grid { grid-template-columns: 1fr; gap: 1rem; }
        }
        @media (max-width: 480px) {
          .hero-btns { flex-direction: column; align-items: center; }
          .phone-cta-number { font-size: 1.3rem; padding: .9rem 1.5rem; }
        }
      `}</style>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && <a onClick={() => goTo("about")}>За мен</a>}
        <a onClick={() => goTo("services")}>Услуги</a>
        {products.length > 0 && <a onClick={() => goTo("products")}>Козметика</a>}
        {gallery.length > 0 && <a onClick={() => goTo("gallery")}>Галерия</a>}
        <a onClick={() => goTo("contact")}>Контакти</a>
        {phoneHref && (
          <a className="btn-green" href={phoneHref}>
            Запазете час
          </a>
        )}
      </div>

      {/* NAV */}
      <nav className={`zen-navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-logo" onClick={() => goTo("hero")}>
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.salon_name} style={{ height: "38px", width: "auto", objectFit: "contain" }} />
          ) : (
            tenant.salon_name
          )}
        </div>
        <ul className="nav-links">
          {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && <li><a onClick={() => goTo("about")}>За мен</a></li>}
          <li><a onClick={() => goTo("services")}>Услуги</a></li>
          {products.length > 0 && <li><a onClick={() => goTo("products")}>Козметика</a></li>}
          {gallery.length > 0 && <li><a onClick={() => goTo("gallery")}>Галерия</a></li>}
          <li><a onClick={() => goTo("contact")}>Контакти</a></li>
        </ul>
        {phoneHref && <a className="nav-btn" href={phoneHref}>Запазете час</a>}
        <button className="hamburger" onClick={() => setMobileOpen(true)}>
          <span /><span /><span />
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-circles">
          <div className="hero-circle c1" />
          <div className="hero-circle c2" />
          <div className="hero-circle c3" />
        </div>
        <p className="hero-eyebrow">✦ Premium Facecare</p>
        <h1 className="hero-title">
          {tenant.hero_title ? (
            <>{tenant.hero_title}<br />{tenant.hero_subtitle && <em>{tenant.hero_subtitle}</em>}</>
          ) : (
            <>Кожата помни<br /><em>всяка грижа</em></>
          )}
        </h1>
        {tenant.description && (
          <p className="hero-sub">{tenant.description}</p>
        )}
        <div className="hero-btns">
          {phoneHref ? (
            <a className="btn-green" href={phoneHref}>Запазете час</a>
          ) : (
            <a className="btn-green" href="#contact">Запазете час</a>
          )}
          <button className="btn-outline" onClick={() => goTo("services")}>Нашите процедури</button>
        </div>
      </section>

      {/* ABOUT */}
      {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && (
        <div className="about" id="about">
          <div className="about-inner">
            <div className="about-img">
              {tenant.about_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.about_image_url} alt="За мен" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="about-img-char">✦</div>
              )}
              <div className="about-img-tag">Premium Facecare</div>
            </div>
            <div className="about-content">
              <p className="tag">За мен</p>
              <div className="leaf-div"><span>✦</span></div>
              <h2 className="about-title">
                <em>{tenant.salon_name}</em>
              </h2>
              {tenant.about_text1 && <p className="about-txt">{tenant.about_text1}</p>}
              {tenant.about_text2 && <p className="about-txt">{tenant.about_text2}</p>}
            </div>
          </div>
        </div>
      )}

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="container">
          <div className="services-hdr">
            <p className="tag">Процедури</p>
            <div className="leaf-div leaf-center"><span>✦</span></div>
            <h2 className="section-title">Нашите <em>терапии</em></h2>
          </div>

          {multi ? (
            specs.map((sp) => {
              const list = servicesForSpecialist(data, sp.id);
              if (list.length === 0) return null;
              return (
                <div key={sp.id} style={{ marginBottom: "3rem" }}>
                  <p className="spec-section-title">{sp.name}</p>
                  <div className="acc-list">
                    {list.map((s, i) => (
                      <ServiceAccordion key={s.id} service={s} index={i} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="acc-list">
              {services.map((s, i) => (
                <ServiceAccordion key={s.id} service={s} index={i} />
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            {phoneHref ? (
              <a className="btn-green" href={phoneHref}>Запишете се на час</a>
            ) : (
              <a className="btn-green" href="#contact">Запишете се на час</a>
            )}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      {products.length > 0 && (
        <section className="products" id="products">
          <div className="container">
            <div className="products-hdr">
              <p className="tag">Козметика</p>
              <div className="leaf-div leaf-center"><span>✦</span></div>
              <h2 className="section-title">The Skin <em>линия</em></h2>
            </div>
            <div className="products-grid">
              {products.map((p, i) => (
                <div className="product-card fade-up" key={i}>
                  <div className="product-num">0{i + 1}</div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-subtitle">{p.subtitle}</div>
                  <p className="product-desc">{p.description}</p>
                </div>
              ))}
            </div>
            {productsLink && (
              <div className="products-cta">
                <a className="btn-outline" href={productsLink} target="_blank" rel="noopener noreferrer">
                  Виж всички продукти
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="testimonials" id="testimonials">
          <div className="tc-hdr">
            <span className="tc-tag">Отзиви</span>
            <h2 className="tc-title">Те го <em>казват</em></h2>
          </div>
          <TestimonialsCarousel items={testimonials} />
        </section>
      )}

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="gallery" id="gallery">
          <div className="container">
            <div className="gallery-hdr">
              <p className="tag">Галерия</p>
              <div className="leaf-div leaf-center"><span>✦</span></div>
              <h2 className="section-title">Резултати <em>в снимки</em></h2>
            </div>
          </div>
          <div className="gallery-scroll-wrap">
            <div className="gallery-scroll">
              {gallery.map((g) => (
                <div className="g-item" key={g.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="g-lbl" />
                </div>
              ))}
            </div>
          </div>
          {igHref && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <a href={igHref} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Вижте повече в Instagram
              </a>
            </div>
          )}
        </section>
      )}

      {/* PHONE CTA */}
      <div className="phone-cta" id="booking">
        <div className="container">
          <p className="tag" style={{ display: "block", textAlign: "center", marginBottom: "1rem" }}>Запазете час</p>
          <div className="leaf-div leaf-center"><span>✦</span></div>
          <h2 className="phone-cta-title">Готови ли сте за <em>трансформация?</em></h2>
          <p className="phone-cta-sub">Обадете се и запазете своя час при Валентина.</p>
          {phoneHref && tenant.phone && (
            <div>
              <a href={phoneHref} className="phone-cta-number">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {tenant.phone}
              </a>
              <p className="phone-cta-note">Всеки ден · 09:00 – 19:00</p>
            </div>
          )}
        </div>
      </div>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div>
              <p className="tag">Контакти</p>
              <div className="leaf-div"><span>✦</span></div>
              <h2 className="contact-title">Намерете <em>ни</em></h2>
              <div className="contact-info">
                {tenant.address && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div><div className="contact-lbl">Адрес</div><div className="contact-val">{tenant.address}</div></div>
                  </div>
                )}
                {tenant.phone && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <div><div className="contact-lbl">Телефон</div><div className="contact-val"><a href={`tel:${tenant.phone}`}>{tenant.phone}</a></div></div>
                  </div>
                )}
                {tenant.email && (
                  <div className="contact-row">
                    <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <div><div className="contact-lbl">Имейл</div><div className="contact-val"><a href={`mailto:${tenant.email}`}>{tenant.email}</a></div></div>
                  </div>
                )}
                <div className="contact-row">
                  <svg className="contact-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <div className="contact-lbl">Работно Време</div>
                    <div className="hours-table">
                      {data.workingHours.map((wh) => (
                        <div className="hours-row" key={wh.id}>
                          <span className="hours-day">{DAY_LABELS[wh.day_of_week]}</span>
                          <span className={wh.is_day_off ? "hours-closed" : "hours-time"}>
                            {wh.is_day_off ? "Почивен" : `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="map-wrap">
                {mapsSrc ? (
                  <iframe src={mapsSrc} style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                ) : (
                  <>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--green)", opacity: .4 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>Google Maps</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL BAR */}
      {(igHref || fbHref || tkHref) && (
        <div className="social-bar">
          <div className="social-bar-inner">
            {igHref && (
              <>
                <a href={igHref} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                  Instagram
                </a>
                {(fbHref || tkHref) && <div className="social-div" />}
              </>
            )}
            {fbHref && (
              <>
                <a href={fbHref} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  Facebook
                </a>
                {tkHref && <div className="social-div" />}
              </>
            )}
            {tkHref && (
              <a href={tkHref} target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="zen-footer">
        <div className="container">
          <div className="footer-logo">{tenant.salon_name}</div>
          <p className="footer-tag">✦ Premium Facecare ✦</p>
          <nav className="footer-nav">
            {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && <a onClick={() => goTo("about")}>За мен</a>}
            <a onClick={() => goTo("services")}>Услуги</a>
            {products.length > 0 && <a onClick={() => goTo("products")}>Козметика</a>}
            {gallery.length > 0 && <a onClick={() => goTo("gallery")}>Галерия</a>}
            <a onClick={() => goTo("contact")}>Контакти</a>
          </nav>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {tenant.salon_name}</span>
            <span className="dot" />
            <span>Всички права запазени</span>
            <span className="dot" />
            <a href="https://salonapp.pro">SalonApp.pro</a>
          </div>
        </div>
      </footer>
    </>
  );
}
