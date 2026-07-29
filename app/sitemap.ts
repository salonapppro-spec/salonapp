import type { MetadataRoute } from "next";
import { listActiveTenantsForSitemap } from "@/lib/internal/sitemap-tenants";
import { getAllPostMeta } from "@/lib/blog";

const BASE_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro").replace(/\/$/, "");

// Обновява se hourly — активните тенанти се променят рядко
export const revalidate = 3600;

/**
 * sitemap.ts — динамичен sitemap за SalonApp.pro
 *
 * Включва:
 * - Статични маркетинг страници (/, /get-started)
 * - Всички активни тенант сайтове от базата данни
 *
 * Изключва:
 * - /admin, /super-admin, /api (блокирани и в robots.ts)
 * - Неактивни тенанти (status != 'active')
 * - /temporarily-unavailable
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/get-started`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/legal/terms`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Блог статии — четат se от content/blog/*.md
  const blogPages: MetadataRoute.Sitemap = getAllPostMeta().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  try {
    const tenants = await listActiveTenantsForSitemap();

    if (tenants.length === 0) {
      return [...staticPages, ...blogPages];
    }

    const tenantPages: MetadataRoute.Sitemap = tenants.map((t) => ({
      url: `${BASE_URL}/${t.salon_slug}`,
      lastModified: t.created_at ? new Date(t.created_at as string) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    return [...staticPages, ...blogPages, ...tenantPages];
  } catch {
    // Fallback при грешка — поне статичните + блог страниците са в sitemap
    return [...staticPages, ...blogPages];
  }
}
