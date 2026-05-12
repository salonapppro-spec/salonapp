import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import type { SalonData } from "@/types/database";
import type { Template } from "@/types";
import { loadPublicSalonData } from "@/lib/data";
import { mergeTokens, tokensToCssVars } from "@/lib/design-tokens";
import { ConsentAnalytics } from "@/components/ConsentAnalytics";
import { Bloom } from "@/components/templates/Bloom";
import { Bold } from "@/components/templates/Bold";
import { Clean } from "@/components/templates/Clean";
import { Groom } from "@/components/templates/Groom";
import { Luxe } from "@/components/templates/Luxe";
import { Luxe2 } from "@/components/templates/Luxe2";
import { Zen } from "@/components/templates/Zen";
import { TheSkin } from "@/components/templates/TheSkin";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function resolveSlug(paramSlug: string): Promise<string> {
  const h = await headers();
  return h.get("x-salon-slug") ?? paramSlug;
}

function isValidSlug(slug: string): boolean {
  return slug.length <= 80 && SLUG_RE.test(slug);
}

function renderTemplate(template: Template, data: SalonData) {
  switch (template) {
    case "bloom":  return <Bloom data={data} />;
    case "luxe":   return <Luxe data={data} />;
    case "clean":  return <Clean data={data} />;
    case "zen":    return <Zen data={data} />;
    case "bold":   return <Bold data={data} />;
    case "luxe2":  return <Luxe2 data={data} />;
    case "groom":  return <Groom data={data} />;
    case "theskin": return <TheSkin data={data} />;
    default:       return <Bloom data={data} />;
  }
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
      {/* Google Fonts — all supported typefaces preloaded */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@400;600;700&family=Dancing+Script:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Italiana&family=Josefin+Sans:wght@300;400;600;700&family=Lato:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&display=swap"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ConsentAnalytics
        facebookPixelId={data.tenant.facebook_pixel_id}
        gtmId={data.tenant.gtm_id}
        clarityId={data.tenant.clarity_id}
      />
      <div id="salon-design-root" style={designVarStyle}>
        {renderTemplate(data.tenant.template, data)}
      </div>
    </>
  );
}
