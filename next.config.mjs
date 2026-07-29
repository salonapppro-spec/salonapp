/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

// 'unsafe-eval' is required by Next.js React Fast Refresh in dev mode only.
// In production, Next.js does not use eval so this is safe to omit there.
const isDev = process.env.NODE_ENV === "development";

function sentryIngestOrigin() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    return new URL(dsn).origin;
  } catch {
    return null;
  }
}

const sentryOrigin = sentryIngestOrigin();
const connectSrcParts = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://api.stripe.com",
  "https://www.facebook.com",
  "https://region1.analytics.google.com",
  ...(sentryOrigin ? [sentryOrigin] : []),
];

// CSP е активен (enforcement режим) — блокира нарушения и ги логва в DevTools.
const CSP_POLICY = [
  "default-src 'self'",
  // Next.js изисква unsafe-inline за hydration; GTM/Pixel/Clarity са external скриптове
  // unsafe-eval е нужен само в dev режим (React Fast Refresh / HMR)
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms https://www.google-analytics.com`,
  // Inline styles се ползват масово в templates
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Supabase Storage за снимки; Unsplash само в dev (placeholder изображения)
  `img-src 'self' data: blob: https://*.supabase.co https://*.salonapp.pro https://www.google.com https://www.gstatic.com https://www.facebook.com${isDev ? " https://images.unsplash.com" : ""}`,
  // Iframe preview в super-admin builder + Google Maps iframe
  "frame-src 'self' https://www.google.com https://maps.google.com https://*.salonapp.pro",
  // Supabase realtime + REST, Stripe, Meta CAPI + Sentry ingest
  `connect-src ${connectSrcParts.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const PUBLIC_CSP_POLICY = [
  CSP_POLICY,
  "frame-ancestors 'self' https://salonapp.pro https://www.salonapp.pro https://*.salonapp.pro",
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        // Публичните салонски сайтове могат да се зареждат в iframe (за Visual Builder preview)
        source: "/:salon_slug((?!super-admin|admin|api)[^/]+)(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: PUBLIC_CSP_POLICY },
        ],
      },
      {
        source: "/(super-admin|admin|api)(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP_POLICY },
          // HTTP-level noindex — belt-and-suspenders заедно с metadata robots
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  automaticVercelMonitors: true,
  // App Router only — no pages/ dir, don't try to instrument _app/_error
  autoInstrumentServerFunctions: true,
  disableLogger: true,
});
