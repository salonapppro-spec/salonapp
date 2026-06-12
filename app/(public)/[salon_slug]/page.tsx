import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import type { ComponentType } from "react";
import type { SalonData } from "@/types/database";
import { loadPublicSalonData } from "@/lib/data";
import { mergeTokens, tokensToCssVars } from "@/lib/design-tokens";
import { ConsentAnalytics } from "@/components/ConsentAnalytics";
import { PawEmpire } from "@/components/paw-empire/PawEmpireSite";
import { TheBeastSite } from "@/components/tenants/TheBeastSite";
import { EuphoriaSite } from "@/components/tenants/euphoria/Page";
import { LindySite } from "@/components/tenants/lindy/Page";
import { TheSkinSite } from "@/components/tenants/theskin/Page";
import { MagneticEyesSite } from "@/components/tenants/magnetic-eyes/Page";

// ── Per-tenant site registry ───────────────────────────────────────────────────
// Each tenant has its own unique component. To add a new tenant:
// 1. Create components/tenants/[slug]/Page.tsx
// 2. Import it here and add to TENANT_SITES
const TENANT_SITES: Record<string, ComponentType<{ data: SalonData }>> = {
  "paw-empire":    PawEmpire,
  "thebeast":      TheBeastSite,
  "euphoria":      EuphoriaSite,
  "lindynails":    LindySite,
  "theskin":       TheSkinSite,
  "magnetic-eyes": MagneticEyesSite,
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function resolveSlug(paramSlug: string): Promise<string> {
  const h = await headers();
  return h.get("x-salon-slug") ?? paramSlug;
}

function isValidSlug(slug: string): boolean {
  return slug.length <= 80 && SLUG_RE.test(slug);
}

function UnderConstruction({ data }: { data: SalonData }) {
  const name = data.tenant.salon_name;
  const logo = data.tenant.logo_url?.trim();
  return (
    <div style={{
      minHeight: "100svh",
      background: "#0f0f0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      color: "#f5f5f5",
      textAlign: "center",
      padding: "2rem",
      gap: "1.5rem",
    }}>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} style={{ height: "64px", objectFit: "contain", marginBottom: ".5rem" }} />
      )}
      <h1 style={{ fontSize: "clamp(1.4rem,4vw,2.2rem)", fontWeight: 700, letterSpacing: "-.02em", margin: 0 }}>
        {name}
      </h1>
      <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.45)", margin: 0, maxWidth: "360px", lineHeight: 1.6 }}>
        Сайтът е в изграждане.<br />Очаквайте скоро.
      </p>
      <div style={{ width: "40px", height: "2px", background: "rgba(255,255,255,.15)", borderRadius: "2px" }} />
      {data.tenant.phone && (
        <a href={`tel:${data.tenant.phone}`} style={{ color: "rgba(255,255,255,.5)", fontSize: ".9rem", textDecoration: "none" }}>
          {data.tenant.phone}
        </a>
      )}
    </div>
  );
}

function renderSite(slug: string, data: SalonData) {
  const Site = TENANT_SITES[slug];
  if (Site) return <Site data={data} />;
  // Сайтът е в изграждане — ще бъде построен от SalonApp екипа
  return <UnderConstruction data={data} />;
}

function beautyBusinessJsonLd(data: SalonData, canonicalUrl: string) {
  const { tenant, gallery, services } = data;
  const brandImage = tenant.logo_url?.trim() || tenant.hero_image_url?.trim() || gallery[0]?.url;

  const hasOfferCatalog =
    services.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Услуги",
            itemListElement: services.slice(0, 10).map((s) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: s.name,
              },
              ...(s.price_eur != null
                ? { price: String(s.price_eur), priceCurrency: "EUR" }
                : {}),
            })),
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: tenant.salon_name,
    url: canonicalUrl,
    description: tenant.description ?? undefined,
    image: brandImage,
    telephone: tenant.phone ?? undefined,
    address: tenant.address
      ? { "@type": "PostalAddress", streetAddress: tenant.address }
      : undefined,
    ...hasOfferCatalog,
  };
}

export async function generateMetadata(props: { params: Promise<{ salon_slug: string }> }): Promise<Metadata> {
  const { salon_slug: paramSlug } = await props.params;
  const slug = await resolveSlug(paramSlug);
  if (!isValidSlug(slug)) return { title: "Салон", robots: { index: false } };
  const data = await loadPublicSalonData(slug);
  if (!data) return { title: "Салон", robots: { index: false } };

  // Неактивните тенанти не трябва да се индексират
  if (data.tenant.status === "inactive") {
    return {
      title: data.tenant.salon_name,
      robots: { index: false, follow: false },
    };
  }

  // "Сайтът е в изграждане" — thin content, не се индексира.
  // Щом slug-ът влезе в TENANT_SITES, noindex пада автоматично.
  if (!TENANT_SITES[slug]) {
    return {
      title: data.tenant.salon_name,
      robots: { index: false, follow: false },
    };
  }

  const canonical = `https://${slug}.salonapp.pro`;

  // Title: max 60 символа — "Salon Name — онлайн резервации"
  const suffix = " — онлайн резервации";
  const maxNameLen = 60 - suffix.length; // 40 chars за name
  const salonName = data.tenant.salon_name.slice(0, maxNameLen);
  const title = `${salonName}${suffix}`;

  // Description: 140-160 символа
  const fallbackDesc = `Запази час онлайн в ${data.tenant.salon_name}. Онлайн резервации 24/7, без телефонни обаждания. Запазете час лесно и бързо чрез SalonApp.pro.`;
  const description = (data.tenant.description?.slice(0, 160) ?? fallbackDesc).slice(0, 160);

  const t = data.tenant;
  const ogImage = t.logo_url?.trim() || t.hero_image_url?.trim() || data.gallery[0]?.url;
  const ogHttps = ogImage && /^https:\/\//i.test(ogImage) ? ogImage : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    ...(ogHttps ? { icons: { icon: [{ url: ogHttps }], apple: [{ url: ogHttps }] } } : {}),
    openGraph: {
      title: salonName,
      description,
      url: canonical,
      siteName: "SalonApp.pro",
      locale: "bg_BG",
      type: "website",
      images: ogHttps ? [{ url: ogHttps, alt: `${salonName} — снимка` }] : undefined,
    },
    twitter: {
      card: ogHttps ? "summary_large_image" : "summary",
      title: salonName,
      description,
      images: ogHttps ? [ogHttps] : undefined,
    },
  };
}

export default async function PublicSalonPage(props: {
  params: Promise<{ salon_slug: string }>;
}) {
  const { salon_slug: paramSlug } = await props.params;
  const slug = await resolveSlug(paramSlug);
  if (!isValidSlug(slug)) notFound();
  const data = await loadPublicSalonData(slug);
  if (!data) notFound();

  if (data.tenant.status === "inactive") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center text-brand-900">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Временно недостъпно</h1>
        <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-brand-800/90 sm:text-base">
          Този салон не е активен в момента. Моля, опитайте по-късно или се свържете директно с него.
        </p>
      </div>
    );
  }

  const tokens = mergeTokens(
    (data.tenant.design_tokens ?? null) as Parameters<typeof mergeTokens>[0]
  );

  const designVarStyle = tokensToCssVars(tokens) as CSSProperties;

  const canonicalUrl = `https://${slug}.salonapp.pro`;
  const jsonLd = beautyBusinessJsonLd(data, canonicalUrl);

  // Hero-то е LCP елементът — preload го стартира веднага, преди браузърът
  // да е стигнал до <img> тага в HTML-а.
  const heroUrl = data.tenant.hero_image_url?.trim();
  const heroPreload = heroUrl && /^https:\/\//i.test(heroUrl) ? heroUrl : null;

  return (
    <>
      {heroPreload && <link rel="preload" as="image" href={heroPreload} fetchPriority="high" />}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@400;600;700&family=Dancing+Script:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Italiana&family=Josefin+Sans:wght@300;400;600;700&family=Lato:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&display=swap"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ConsentAnalytics
        facebookPixelId={data.tenant.facebook_pixel_id}
        gtmId={data.tenant.gtm_id}
        clarityId={data.tenant.clarity_id}
      />
      <div id="salon-design-root" style={designVarStyle}>
        {renderSite(slug, data)}
      </div>
    </>
  );
}
