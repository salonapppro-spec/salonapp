import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { loadPublicSalonData } from "@/lib/data";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { tenantPublicPath } from "@/lib/routing/public-paths";

// Booking flow е функционален UI без собствено съдържание — дублира главната
// страница на салона, затова не се индексира (follow остава за линковете).
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

async function resolveSlug(paramSlug: string): Promise<string> {
  const h = await headers();
  return h.get("x-salon-slug") ?? paramSlug;
}

export default async function PublicBookingPage(props: { params: Promise<{ salon_slug: string }> }) {
  const { salon_slug: paramSlug } = await props.params;
  const slug = await resolveSlug(paramSlug);
  const data = await loadPublicSalonData(slug);
  if (!data) notFound();

  if (data.tenant.status === "inactive") {
    const host = (await headers()).get("host") ?? "";
    const homePath = tenantPublicPath(slug, undefined, host);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
        <h1 className="text-xl font-semibold text-brand-900">Временно недостъпно</h1>
        <p className="mt-3 text-sm text-brand-800/90">Онлайн записване не е активно за този салон.</p>
        <Link href={homePath} className="mt-6 text-sm font-semibold text-brand-700 underline">
          Към началото
        </Link>
      </div>
    );
  }

  return <BookingFlow salonData={data} />;
}
