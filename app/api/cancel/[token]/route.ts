import { NextResponse } from "next/server";

import { hoursUntilBooking } from "@/lib/booking-datetime";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:0 auto;line-height:1.5">${body}</body></html>`;
}

async function findBooking(token: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id,status,booking_date,booking_time")
    .eq("confirmation_token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; status: string; booking_date: string; booking_time: string };
}

// GET — показва страница с бутон за отказ
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await ctx.params;
  const token = decodeURIComponent(rawToken ?? "").trim();
  if (!token) {
    return new NextResponse(htmlPage("Грешка", "<p>Невалиден линк.</p>"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const booking = await findBooking(token);
  if (!booking) {
    return new NextResponse(htmlPage("Не е намерено", "<p>Резервацията не е намерена.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "no_show") {
    return new NextResponse(
      htmlPage("Статус", "<p>Тази резервация вече не може да бъде променена от този линк.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const hours = hoursUntilBooking(booking.booking_date, booking.booking_time);
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
export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await ctx.params;
  const token = decodeURIComponent(rawToken ?? "").trim();
  if (!token) {
    return new NextResponse(htmlPage("Грешка", "<p>Невалиден линк.</p>"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const booking = await findBooking(token);
  if (!booking) {
    return new NextResponse(htmlPage("Не е намерено", "<p>Резервацията не е намерена.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "no_show") {
    return new NextResponse(
      htmlPage("Статус", "<p>Тази резервация вече не може да бъде променена от този линк.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const hours = hoursUntilBooking(booking.booking_date, booking.booking_time);
  if (hours < 24) {
    return new NextResponse(
      htmlPage("Твърде късно за отказ", "<p>Отказът е възможен най-малко <strong>24 часа</strong> преди часа. Моля, свържете се със салона.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking.id);

  if (error) {
    return new NextResponse(htmlPage("Грешка", "<p>Неуспешен отказ. Опитайте отново.</p>"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(
    htmlPage("Отказана ✓", "<p>Резервацията ви е отменена успешно.</p>"),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
