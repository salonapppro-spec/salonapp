import { CookieBanner } from "@/components/CookieBanner";

/**
 * Layout за всички публични салонски сайтове.
 * CookieBanner се показва само тук — не в admin/super-admin.
 *
 * Обхваща:
 *   app/(public)/[salon_slug]/page.tsx
 *   app/(public)/[salon_slug]/booking/page.tsx
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
