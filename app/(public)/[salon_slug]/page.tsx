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

// ── Per-tenant site registry ───────────────────────────────────────────────────
// Each tenant has its own unique component. To add a new tenant:
// 1. Create components/tenants/[slug]/Page.tsx
// 2. Import it here and add to TENANT_SITES
const TENANT_SITES: Record<string, ComponentType<{ data: SalonData }>> = {
  "paw-empire": PawEmpire,
  "thebeast":   TheBeastSite,
  "euphoria":   EuphoriaSite,
  "lindy":      LindySite,
  "theskin":    TheSkinSite,
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
  const { tenant, gallery } = data;
  const brandImage = tenant.logo_url?.trim() || tenant.hero_image_url?.trim() || gallery[0]?.url;
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
  };
}

export async function generateMetadata(props: { params: Promise<{ salon_slug: string }> }): Promise<Metadata> {
  const { salon_slug: paramSlug } = await props.params;
  const slug = await resolveSlug(paramSlug);
  if (!isValidSlug(slug)) return { title: "Салон" };
  const data = await loadPublicSalonData(slug);
  if (!data) return { title: "Салон" };

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro").replace(/\/$/, "");
  const canonical = `${base}/${slug}`;
  const title = `${data.tenant.salon_name} — онлайн резервации`;
  const description =
    data.tenant.description?.slice(0, 160) ??
    `Запази час в ${data.tenant.salon_name}. Онлайн резервации чрез SalonApp.pro.`;
  const t = data.tenant;
  const ogImage = t.logo_url?.trim() || t.hero_image_url?.trim() || data.gallery[0]?.url;
  const ogHttps = ogImage && /^https:\/\//i.test(ogImage) ? ogImage : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    ...(ogHttps ? { icons: { icon: [{ url: ogHttps }], apple: [{ url: ogHttps }] } } : {}),
    openGraph: {
      title: data.tenant.salon_name,
      description,
      url: canonical,
      siteName: "SalonApp.pro",
      locale: "bg_BG",
      type: "website",
      images: ogHttps ? [{ url: ogHttps }] : undefined,
    },
    twitter: {
      card: ogHttps ? "summary_large_image" : "summary",
      title: data.tenant.salon_name,
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

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro").replace(/\/$/, "");
  const canonicalUrl = `${base}/${slug}`;
  const jsonLd = beautyBusinessJsonLd(data, canonicalUrl);

  return (
    <>
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
