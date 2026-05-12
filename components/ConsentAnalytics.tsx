"use client";

import { useEffect, useState } from "react";
import { getStoredConsent, type CookieConsent } from "@/components/CookieBanner";

// Only alphanumeric, hyphens and underscores — guards against XSS
function safeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/[^A-Za-z0-9_\-]/g, "");
  return clean.length > 0 ? clean : null;
}

function injectFbPixel(pixelId: string) {
  if (typeof window === "undefined") return;
  if ((window as unknown as Record<string, unknown>).fbq) return;
  const script = document.createElement("script");
  script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
  document.head.appendChild(script);
}

function injectGtm(gtmId: string) {
  if (typeof window === "undefined") return;
  const existing = document.querySelector(`script[data-gtm="${gtmId}"]`);
  if (existing) return;
  const script = document.createElement("script");
  script.setAttribute("data-gtm", gtmId);
  script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
  document.head.appendChild(script);
}

function injectClarity(clarityId: string) {
  if (typeof window === "undefined") return;
  const existing = document.querySelector(`script[data-clarity="${clarityId}"]`);
  if (existing) return;
  const script = document.createElement("script");
  script.setAttribute("data-clarity", clarityId);
  script.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`;
  document.head.appendChild(script);
}

export function ConsentAnalytics(props: {
  facebookPixelId?: string | null;
  gtmId?: string | null;
  clarityId?: string | null;
}) {
  const pixelId = safeId(props.facebookPixelId);
  const gtmId = safeId(props.gtmId);
  const clarityId = safeId(props.clarityId);

  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    // Read initial consent
    setConsent(getStoredConsent());

    // Listen for future consent changes (e.g. user clicks "Accept all" in the banner)
    function onConsentChange(e: Event) {
      setConsent((e as CustomEvent<CookieConsent>).detail);
    }
    window.addEventListener("cookieConsentChange", onConsentChange);
    return () => window.removeEventListener("cookieConsentChange", onConsentChange);
  }, []);

  useEffect(() => {
    if (!consent) return;

    if (consent.analytics) {
      if (gtmId) injectGtm(gtmId);
      if (clarityId) injectClarity(clarityId);
    }

    if (consent.marketing) {
      if (pixelId) injectFbPixel(pixelId);
    }
  }, [consent, pixelId, gtmId, clarityId]);

  return null;
}
