import { NextResponse } from "next/server";

import { logAbuseEvent } from "@/lib/abuse-log";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { CreateBookingSchema } from "@/schemas/booking";
import { assertTenantActiveForPublicApi } from "@/lib/public-tenant-guard";
import { requireTenantFromHeaders } from "@/lib/tenant-request";
import { loadCreateBookingContext, runCreateBooking } from "@/lib/booking-mutations";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Невалидни данни";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;
  const tenant = requireTenantFromHeaders(req, { claimedSlug: data.salon_slug, path: "/api/bookings", method: "POST" });
  if (!tenant.ok) return tenant.response;
  const trustedSalonSlug = tenant.salonSlug;
  const trustedData = { ...data, salon_slug: trustedSalonSlug };

  const gate = await assertTenantActiveForPublicApi(trustedSalonSlug);
  if (!gate.ok) return gate.response;

  const ctx = await loadCreateBookingContext(trustedSalonSlug);
  if (!ctx) {
    return NextResponse.json({ error: "Салонът не е намерен." }, { status: 404 });
  }

  const result = await runCreateBooking(trustedData, ctx);
  if (!result.ok) {
    const conflict =
      result.code === "23P01" ||
      result.error.includes("зает") ||
      result.error.includes("блокиран");
    const status = conflict ? 409 : 500;
    if (status === 500) {
      logAbuseEvent({
        kind: "server_error",
        path: "/api/bookings",
        method: "POST",
        status: 500,
        ip: clientIpFromHeaders(req.headers),
        detail: result.code ?? "create_booking_failed",
      });
    }
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, booking_id: result.bookingId });
}
