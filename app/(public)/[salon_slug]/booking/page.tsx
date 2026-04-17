import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { loadPublicSalonData } from "@/lib/data";
import { BookingFlow } from "@/components/booking/BookingFlow";

function resolveSlug(paramSlug: string): string {
  const h = headers();
  return h.get("x-salon-slug") ?? paramSlug;
}

export default async function PublicBookingPage(props: { params: Promise<{ salon_slug: string }> }) {
  const { salon_slug: paramSlug } = await props.params;
  const slug = resolveSlug(paramSlug);
  const data = await loadPublicSalonData(slug);
  if (!data) notFound();

  if (data.tenant.status === "inactive") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
        <h1 className="text-xl font-semibold text-brand-900">Временно недостъпно</h1>
        <p className="mt-3 text-sm text-brand-800/90">Онлайн записване не е активно за този салон.</p>
        <Link href={`/${slug}`} className="mt-6 text-sm font-semibold text-brand-700 underline">
          Към началото
        </Link>
      </div>
    );
  }

  return <BookingFlow salonData={data} />;
}
