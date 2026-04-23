/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

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

// CSP в report-only режим — не блокира, само логва нарушения в DevTools.
// Когато провериш, че нищо не се чупи, смени на Content-Security-Policy.
const CSP_POLICY = [
  "default-src 'self'",
  // Next.js изисква unsafe-inline за hydration; GTM/Pixel/Clarity са external скриптове
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms https://www.google-analytics.com",
  // Inline styles се ползват масово в templates
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Supabase Storage за снимки
  "img-src 'self' data: blob: https://*.supabase.co https://*.salonapp.pro https://www.google.com https://www.gstatic.com",
  // Google Maps iframe (след XSS fix)
  "frame-src https://www.google.com",
  // Supabase realtime + REST, Stripe, Meta CAPI + Sentry ingest
  `connect-src ${connectSrcParts.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
          { key: "Content-Security-Policy", value: CSP_POLICY },
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
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
