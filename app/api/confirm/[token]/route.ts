import { NextResponse } from "next/server";

import { findBookingByToken, parseBookingTokenSalonSlug } from "@/lib/booking-token-action";
import { afterBookingTokenConfirm } from "@/lib/booking-token-side-effects";
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

// GET — показва страница с бутон за потвърждение
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await ctx.params;
  const { token, salonSlug } = tokenAndSalonFromRequest(req, rawToken);
  if (!token || !salonSlug) return invalidLinkResponse();

  const booking = await findBookingByToken(token, salonSlug, "id,status");
  if (!booking) {
    return new NextResponse(htmlPage("Не е намерено", "<p>Резервацията не е намерена.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const status = String(booking.status ?? "");
  if (status === "confirmed") {
    return new NextResponse(
      htmlPage("Вече потвърдено", "<p>Присъствието ви вече е потвърдено. Благодарим!</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (status === "cancelled" || status === "no_show" || status === "completed") {
    return new NextResponse(
      htmlPage("Отказана резервация", "<p>Тази резервация вече не е активна.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const body = `
    <h2 style="margin-bottom:1rem">Потвърдете присъствието си</h2>
    <p style="margin-bottom:1.5rem">Моля натиснете бутона по-долу, за да потвърдите резервацията си.</p>
    <form method="POST">
      <button type="submit" style="background:#C9A84C;color:#fff;border:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;width:100%">
        Потвърждавам присъствието си
      </button>
    </form>
  `;
  return new NextResponse(htmlPage("Потвърди резервация", body), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// POST — извършва реалното потвърждение
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await ctx.params;
  const { token, salonSlug } = tokenAndSalonFromRequest(req, rawToken);
  if (!token || !salonSlug) return invalidLinkResponse();

  const booking = await findBookingByToken(token, salonSlug, "id,status");
  if (!booking) {
    return new NextResponse(htmlPage("Не е намерено", "<p>Резервацията не е намерена.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const status = String(booking.status ?? "");
  const bookingId = String(booking.id ?? "");

  if (status === "confirmed") {
    return new NextResponse(
      htmlPage("Вече потвърдено", "<p>Присъствието ви вече е потвърдено. Благодарим!</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (status === "cancelled" || status === "no_show" || status === "completed") {
    return new NextResponse(
      htmlPage("Отказана резервация", "<p>Тази резервация вече не е активна.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("salon_slug", salonSlug)
    .eq("confirmation_token", token)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return new NextResponse(htmlPage("Грешка", "<p>Неуспешно потвърждение. Опитайте отново.</p>"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!updated) {
    return new NextResponse(
      htmlPage("Вече обработено", "<p>Тази резервация вече е обработена.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  await afterBookingTokenConfirm(salonSlug, bookingId);

  return new NextResponse(
    htmlPage("Потвърдено ✓", "<p><strong>Благодарим!</strong> Присъствието ви е потвърдено.</p>"),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
