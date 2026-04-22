import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import type { SalonData } from "@/types/database";
import type { Template } from "@/types";
import { loadPublicSalonData } from "@/lib/data";
import { mergeTokens, tokensToCssVars } from "@/lib/design-tokens";
import { Bloom } from "@/components/templates/Bloom";
import { Bold } from "@/components/templates/Bold";
import { Clean } from "@/components/templates/Clean";
import { Groom } from "@/components/templates/Groom";
import { Luxe } from "@/components/templates/Luxe";
import { Luxe2 } from "@/components/templates/Luxe2";
import { Zen } from "@/components/templates/Zen";

async function resolveSlug(paramSlug: string): Promise<string> {
  const h = await headers();
  return h.get("x-salon-slug") ?? paramSlug;
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

export default async function PublicSalonPage(props: { params: Promise<{ salon_slug: string }> }) {
  const { salon_slug: paramSlug } = await props.params;
  const slug = await resolveSlug(paramSlug);
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

  // Inline script — listens for builder postMessage and applies CSS vars instantly
  const postMessageScript = `
(function(){
  var fonts=["Inter, sans-serif","'Playfair Display', serif","Montserrat, sans-serif","'Cormorant Garamond', serif","Lato, sans-serif","Raleway, sans-serif","Poppins, sans-serif","'DM Sans', sans-serif","Outfit, sans-serif","Nunito, sans-serif","'Josefin Sans', sans-serif","'Bebas Neue', sans-serif","Cinzel, serif","'Dancing Script', cursive","Italiana, serif","'Libre Baskerville', serif"];
  var radii=["0","0.375rem","0.75rem","1.5rem","9999px"];
  var hex=/^#[0-9A-Fa-f]{6}$/;
  var len=/^(?:0|[0-9]+(?:\\.[0-9]+)?(?:px|rem|em))$/;
  var pair=/^(?:0|[0-9]+(?:\\.[0-9]+)?(?:px|rem|em))(?:\\s+(?:0|[0-9]+(?:\\.[0-9]+)?(?:px|rem|em)))?$/;
  function allow(v,type){
    if(typeof v!=="string")return false;
    if(type==="hex")return hex.test(v);
    if(type==="font")return fonts.indexOf(v)!==-1;
    if(type==="radius")return radii.indexOf(v)!==-1;
    if(type==="length")return len.test(v);
    if(type==="pair")return pair.test(v);
    return false;
  }
  function set(r,name,value,type){
    if(allow(value,type))r.setProperty(name,value);
  }
  window.addEventListener("message",function(e){
    if(!e.data||e.data.type!=="builder-preview")return;
    var t=e.data.tokens;
    if(!t)return;
    var el=document.getElementById("salon-design-root");
    var r=(el||document.documentElement).style;
    set(r,"--color-primary",t.primaryColor,"hex");
    set(r,"--color-bg",t.backgroundColor,"hex");
    set(r,"--color-text",t.textColor,"hex");
    set(r,"--color-accent",t.accentColor,"hex");
    set(r,"--font-family",t.fontFamily,"font");
    set(r,"--font-heading",t.headingFont,"font");
    set(r,"--font-body",t.bodyFont,"font");
    set(r,"--font-nav",t.navFont,"font");
    set(r,"--font-button",t.buttonFont,"font");
    set(r,"--heading-size",t.headingSize,"length");
    set(r,"--body-size",t.bodySize,"length");
    set(r,"--border-radius",t.borderRadius,"radius");
    set(r,"--button-padding",t.buttonPadding,"pair");
    set(r,"--section-padding",t.sectionPadding,"length");
  });
})();`.trim();

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
      {/* Builder real-time preview listener */}
      <script dangerouslySetInnerHTML={{ __html: postMessageScript }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div id="salon-design-root" style={designVarStyle}>
        {renderTemplate(data.tenant.template, data)}
      </div>
    </>
  );
}
