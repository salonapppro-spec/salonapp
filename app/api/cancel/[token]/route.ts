import { NextResponse } from "next/server";

import { hoursUntilBooking } from "@/lib/booking-datetime";
import { findBookingByToken, parseBookingTokenSalonSlug } from "@/lib/booking-token-action";
import { afterBookingTokenCancel } from "@/lib/booking-token-side-effects";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:0 auto;line-height:1.5">${body}</body></html>`;
}

function invalidLinkResponse() {
  return new NextResponse(htmlPage("Грешка", "<p>Невалиден линк.</p>"), {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function tokenAndSalonFromRequest(req: Request, rawToken: string | undefined) {
  const token = decodeURIComponent(rawToken ?? "").trim();
  const salonSlug = parseBookingTokenSalonSlug(new URL(req.url).searchParams.get("salon"));
  return { token, salonSlug };
}

// GET — показва страница с бутон за отказ
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await ctx.params;
  const { token, salonSlug } = tokenAndSalonFromRequest(req, rawToken);
  if (!token || !salonSlug) return invalidLinkResponse();

  const booking = await findBookingByToken(token, salonSlug, "id,status,booking_date,booking_time");
  if (!booking) {
    return new NextResponse(htmlPage("Не е намерено", "<p>Резервацията не е намерена.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const status = String(booking.status ?? "");
  if (status === "cancelled" || status === "completed" || status === "no_show") {
    return new NextResponse(
      htmlPage("Статус", "<p>Тази резервация вече не може да бъде променена от този линк.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const hours = hoursUntilBooking(String(booking.booking_date), String(booking.booking_time));
  if (hours < 24) {
    return new NextResponse(
      htmlPage("Твърде късно за отказ", "<p>Отказът е възможен най-малко <strong>24 часа</strong> преди часа. Моля, свържете се със салона.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const body = `
    <h2 style="margin-bottom:1rem">Отказ на резервация</h2>
    <p style="margin-bottom:1.5rem">Сигурни ли сте, че искате да откажете резервацията си?</p>
    <form method="POST">
      <button type="submit" style="background:#c0392b;color:#fff;border:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;width:100%">
        Да, отказвам резервацията
      </button>
    </form>
  `;
  return new NextResponse(htmlPage("Откажи резервация", body), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// POST — извършва реалния отказ
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await ctx.params;
  const { token, salonSlug } = tokenAndSalonFromRequest(req, rawToken);
  if (!token || !salonSlug) return invalidLinkResponse();

  const booking = await findBookingByToken(token, salonSlug, "id,status,booking_date,booking_time");
  if (!booking) {
    return new NextResponse(htmlPage("Не е намерено", "<p>Резервацията не е намерена.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const status = String(booking.status ?? "");
  const bookingId = String(booking.id ?? "");

  if (status === "cancelled" || status === "completed" || status === "no_show") {
    return new NextResponse(
      htmlPage("Статус", "<p>Тази резервация вече не може да бъде променена от този линк.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const hours = hoursUntilBooking(String(booking.booking_date), String(booking.booking_time));
  if (hours < 24) {
    return new NextResponse(
      htmlPage("Твърде късно за отказ", "<p>Отказът е възможен най-малко <strong>24 часа</strong> преди часа. Моля, свържете се със салона.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("salon_slug", salonSlug)
    .eq("confirmation_token", token)
    .in("status", ["pending", "confirmed"])
    .select("id")
    .maybeSingle();

  if (error) {
    return new NextResponse(htmlPage("Грешка", "<p>Неуспешен отказ. Опитайте отново.</p>"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!updated) {
    return new NextResponse(
      htmlPage("Статус", "<p>Тази резервация вече не може да бъде променена от този линк.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  await afterBookingTokenCancel(salonSlug, bookingId);

  return new NextResponse(
    htmlPage("Отказана ✓", "<p>Резервацията ви е отменена успешно.</p>"),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
