"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CookieBanner } from "@/components/CookieBanner";
import { ConsentAnalytics } from "@/components/ConsentAnalytics";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

const GA4_ID = "G-PXV7BT1S03";

// Само маркетинг страниците — не admin/super-admin/demo, не тенант сайтовете.
const MARKETING_PREFIXES = ["/blog", "/get-started", "/legal", "/privacy", "/unsubscribe"];

/**
 * Cookie банер + consent-gated analytics (GA4 + Meta Pixel) за маркетинг сайта.
 * Тенант сайтовете имат собствен CookieBanner в app/(public)/layout.tsx —
 * тук изключваме тенант subdomain-ите (prod) и тенант path-овете (dev/preview).
 */
export default function MarketingConsent() {
  const pathname = usePathname();
  const [isMainDomain, setIsMainDomain] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const isSalonSubdomain = /^(?!www\.)[^.]+\.salonapp\.pro(:\d+)?$/.test(host);
    setIsMainDomain(!isSalonSubdomain);
  }, []);

  const isMarketing =
    pathname === "/" || MARKETING_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isMainDomain || !isMarketing) return null;

  return (
    <>
      <ConsentAnalytics facebookPixelId={META_PIXEL_ID} ga4MeasurementId={GA4_ID} />
      <CookieBanner />
    </>
  );
}
