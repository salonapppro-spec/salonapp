import Link from "next/link";

import type { SalonData } from "@/types/database";
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
function eurToBgn(eur: number): string {
  return (eur * BGN_RATE).toFixed(2);
}

export function Bloom({ data }: { data: SalonData }) {
  const { tenant, gallery } = data;

  const igHref = safeInstagramHref(tenant.instagram_url);
  const fbHref = safeFacebookHref(tenant.facebook_url);
  const tkHref = safeTiktokHref(tenant.tiktok_url);
  const mapsSrc = safeGoogleMapsEmbedSrc(tenant.google_maps_embed);

  // CSS vars (--color-primary, --color-bg, --font-family, etc.) are injected
  // server-side by the public page and updated in real-time by the builder.
  const primary = "var(--color-primary)";
  const bg = "var(--color-bg)";
  const text = "var(--color-text)";
  const textLight = tenant.primary_color ? `${tenant.primary_color}99` : "#7A5C4F";
  const border = "#E8D5CC";

  const heroTitle = tenant.hero_title ?? tenant.salon_name;
  const heroSubtitle = tenant.hero_subtitle ?? "";
  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const services = servicesFlatForPublic(data);

  return (
    <div style={{ backgroundColor: bg, color: text, fontFamily: "var(--font-family)", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{
        backgroundColor: bg,
        borderBottom: `1px solid ${border}`,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div>
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.salon_name} style={{ height: "40px" }} />
          ) : (
            <span style={{ fontFamily: "var(--font-family)", fontSize: "22px", color: primary, fontWeight: 600 }}>
              {tenant.salon_name}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {[
            { label: "За нас", href: "#about" },
            { label: "Услуги", href: "#services" },
            { label: "Галерия", href: "#gallery" },
            { label: "Контакти", href: "#contacts" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{ color: textLight, textDecoration: "none", fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-nav)" }}>
              {link.label}
            </a>
          ))}
          <Link
            href={`/${tenant.salon_slug}/booking`}
            style={{ backgroundColor: primary, color: "#fff", padding: "var(--button-padding, 10px 20px)", borderRadius: "var(--border-radius, 8px)", textDecoration: "none", fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-button)" }}
          >
            Запази час
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 24px", textAlign: "center", maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "var(--heading-size, clamp(36px, 6vw, 64px))", fontFamily: "var(--font-heading)", fontWeight: 700, lineHeight: 1.15, color: text, marginBottom: "8px" }}>
          {heroTitle}
        </h1>
        {heroSubtitle && (
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontFamily: "var(--font-heading)", fontWeight: 700, lineHeight: 1.15, color: primary, marginBottom: "24px" }}>
            {heroSubtitle}
          </h2>
        )}
        {tenant.description && (
          <p style={{ fontSize: "18px", fontFamily: "var(--font-body)", color: textLight, marginBottom: "40px", lineHeight: 1.7 }}>
            {tenant.description}
          </p>
        )}
        <Link
          href={`/${tenant.salon_slug}/booking`}
          style={{
            display: "inline-block",
            backgroundColor: primary,
            color: "#fff",
            padding: "var(--button-padding, 16px 40px)",
            borderRadius: "var(--border-radius, 12px)",
            textDecoration: "none",
            fontSize: "16px",
            fontFamily: "var(--font-button)",
            fontWeight: 600,
            boxShadow: `0 4px 24px ${primary}55`,
          }}
        >
          Запази час онлайн
        </Link>
      </section>

      {/* ── ABOUT ── */}
      {(tenant.about_text1 || tenant.about_text2 || tenant.about_image_url) && (
        <section id="about" style={{ backgroundColor: "#fff", padding: "64px 24px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", fontFamily: "var(--font-heading)", fontWeight: 700, color: text, marginBottom: "24px", textAlign: "center" }}>
              За нас
            </h2>
            {tenant.about_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.about_image_url}
                alt="За нас"
                style={{ width: "100%", maxHeight: "360px", objectFit: "cover", borderRadius: "16px", marginBottom: "24px" }}
              />
            )}
            {tenant.about_text1 && (
              <p style={{ fontSize: "16px", fontFamily: "var(--font-body)", lineHeight: 1.8, color: textLight, marginBottom: "16px" }}>
                {tenant.about_text1}
              </p>
            )}
            {tenant.about_text2 && (
              <p style={{ fontSize: "16px", fontFamily: "var(--font-body)", lineHeight: 1.8, color: textLight }}>
                {tenant.about_text2}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", fontFamily: "var(--font-heading)", fontWeight: 700, color: text, marginBottom: "8px", textAlign: "center" }}>
            Услуги и цени
          </h2>
          <p style={{ textAlign: "center", fontFamily: "var(--font-body)", color: textLight, marginBottom: "40px" }}>
            Всички цени са в EUR. BGN еквивалент при плащане в брой.
          </p>

          {multi ? (
            specs.map((sp) => {
              const list = servicesForSpecialist(data, sp.id);
              if (list.length === 0) return null;
              return (
                <div key={sp.id} style={{ marginBottom: "40px" }}>
                  <h3 style={{ fontSize: "22px", fontFamily: "var(--font-heading)", fontWeight: 700, color: text, marginBottom: "16px" }}>
                    {sp.name}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                    {list.map((s) => (
                      <div key={s.id} style={{ backgroundColor: "#fff", border: `1px solid ${border}`, borderRadius: "12px", padding: "24px" }}>
                        <h3 style={{ fontSize: "17px", fontFamily: "var(--font-heading)", fontWeight: 600, color: text, marginBottom: "8px" }}>{s.name}</h3>
                        <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: textLight, marginBottom: "16px" }}>
                          {s.is_complex ? "Времето се уточнява" : `⏱ ${s.duration_minutes ?? 0} мин`}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: "22px", fontWeight: 700, color: primary }}>{Number(s.price_eur).toFixed(0)} €</span>
                          <span style={{ fontSize: "13px", color: textLight }}>≈ {eurToBgn(Number(s.price_eur))} лв</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {services.length === 0 ? (
                <p style={{ color: textLight, fontSize: "14px" }}>Няма активни услуги.</p>
              ) : services.map((s) => (
                <div key={s.id} style={{ backgroundColor: "#fff", border: `1px solid ${border}`, borderRadius: "12px", padding: "24px" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: 600, color: text, marginBottom: "8px" }}>{s.name}</h3>
                  <p style={{ fontSize: "13px", color: textLight, marginBottom: "16px" }}>
                    {s.is_complex ? "Времето се уточнява" : `⏱ ${s.duration_minutes ?? 0} мин`}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: primary }}>{Number(s.price_eur).toFixed(0)} €</span>
                    <span style={{ fontSize: "13px", color: textLight }}>≈ {eurToBgn(Number(s.price_eur))} лв</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BOOKING ── */}
      <section id="booking" style={{ backgroundColor: "#fff", padding: "64px 24px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-body)", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: primary, marginBottom: "8px" }}>
              Онлайн записване
            </p>
            <h2 style={{ fontSize: "32px", fontFamily: "var(--font-heading)", fontWeight: 700, color: text, marginBottom: "8px" }}>
              Запазете своя час
            </h2>
            <p style={{ color: textLight, fontFamily: "var(--font-body)", fontSize: "15px" }}>
              Попълнете формата и ще получите имейл потвърждение в рамките на минути.
            </p>
          </div>
          <InlineBookingForm
            salonSlug={tenant.salon_slug}
            services={services}
            primaryColor={primary}
            textColor={text}
            bgColor="#fafafa"
            isDemo={tenant.salon_slug.startsWith("demo/")}
          />
        </div>
      </section>

      {/* ── WORKING HOURS + CONTACTS ── */}
      <section id="contacts" style={{ padding: "64px 24px" }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "40px",
        }}>
          {/* Working hours */}
          <div>
            <h3 style={{ fontSize: "22px", fontFamily: "var(--font-heading)", fontWeight: 700, color: text, marginBottom: "20px" }}>Работно време</h3>
            {data.workingHours.map((wh) => (
              <div key={wh.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${border}`, fontSize: "15px" }}>
                <span style={{ color: text }}>{DAY_LABELS[wh.day_of_week]}</span>
                <span style={{ color: primary, fontWeight: 600 }}>
                  {wh.is_day_off ? "Почивен ден" : `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`}
                </span>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div>
            <h3 style={{ fontSize: "22px", fontFamily: "var(--font-heading)", fontWeight: 700, color: text, marginBottom: "20px" }}>Контакти</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {tenant.address && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: textLight }}>
                  <span>📍</span><span>{tenant.address}</span>
                </div>
              )}
              {tenant.phone && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: textLight }}>
                  <span>📞</span>
                  <a href={`tel:${tenant.phone}`} style={{ color: primary, textDecoration: "none" }}>{tenant.phone}</a>
                </div>
              )}
              {tenant.email && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", color: textLight }}>
                  <span>✉️</span>
                  <a href={`mailto:${tenant.email}`} style={{ color: primary, textDecoration: "none" }}>{tenant.email}</a>
                </div>
              )}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                {igHref && (
                  <a href={igHref} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${border}`, backgroundColor: "#fff", color: text, textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>
                    Instagram
                  </a>
                )}
                {fbHref && (
                  <a href={fbHref} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${border}`, backgroundColor: "#fff", color: text, textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>
                    Facebook
                  </a>
                )}
                {tkHref && (
                  <a href={tkHref} target="_blank" rel="noopener noreferrer"
                    style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${border}`, backgroundColor: "#fff", color: text, textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>
                    TikTok
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Google Maps */}
        {mapsSrc && (
          <div style={{ maxWidth: "900px", margin: "40px auto 0", borderRadius: "16px", overflow: "hidden", border: `1px solid ${border}` }}>
            <iframe src={mapsSrc} width="100%" height="400" style={{ border: 0, display: "block" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
      </section>

      {/* ── GALLERY ── */}
      {gallery.length > 0 && (
        <section id="gallery" style={{ backgroundColor: "#fff", padding: "64px 24px" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", fontFamily: "var(--font-heading)", fontWeight: 700, color: text, marginBottom: "32px", textAlign: "center" }}>
              Галерия
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {gallery.map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={g.id}
                  src={g.url}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "12px", border: `1px solid ${border}` }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: "var(--color-text, #3D2B1F)", color: "#fff", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-family)", fontSize: "20px", marginBottom: "8px" }}>{tenant.salon_name}</p>
        <p style={{ fontSize: "13px", opacity: 0.6 }}>© {new Date().getFullYear()} {tenant.salon_name}. Всички права запазени.</p>
        <p style={{ fontSize: "12px", opacity: 0.4, marginTop: "8px" }}>
          Powered by{" "}
          <a href="https://salonapp.pro" style={{ color: "#fff", textDecoration: "underline" }}>SalonApp.pro</a>
        </p>
      </footer>
    </div>
  );
}
