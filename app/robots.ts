import type { MetadataRoute } from "next";

const BASE_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro").replace(/\/$/, "");

/**
 * robots.ts — управлява достъпа на ботове за SalonApp.pro
 *
 * Стратегия:
 * - Всички ботове: allow публичен сайт, disallow admin/super-admin/api
 * - AI ботове (2026): явно разрешени с отделни записи за максимална совместимост
 * - /temporarily-unavailable: disallow за всички (тенанти в пауза)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── AI ботове (2026) — явно разрешени за пълно индексиране ──────────
      {
        userAgent: [
          "GPTBot",           // OpenAI ChatGPT
          "ChatGPT-User",     // ChatGPT browsing
          "OAI-SearchBot",    // OpenAI Search
          "ClaudeBot",        // Anthropic Claude
          "anthropic-ai",     // Anthropic AI
          "PerplexityBot",    // Perplexity AI
          "Google-Extended",  // Google AI (Gemini/SGE/AI Overviews)
        ],
        allow: "/",
        disallow: ["/admin", "/super-admin", "/api/"],
      },
      // ── Стандартни ботове ─────────────────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/super-admin",
          "/api/",
          "/temporarily-unavailable",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
