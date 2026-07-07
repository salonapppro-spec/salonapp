import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { SLUG_RE } from "@/lib/routing/constants";

export const dynamic = "force-dynamic";

// Одит A5: отписването е ДЕЙСТВИЕ и става само на POST. GET показва страница
// с бутон за потвърждение — имейл скенери/prefetch-ъри следват GET линкове и
// отписваха клиенти без тяхно знание. Мейл клиентите с one-click unsubscribe
// (RFC 8058) пращат POST към същия URL — обслужва се от POST handler-а.

function html(title: string, body: string) {
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:0 auto;line-height:1.5">${body}</body></html>`;
}

function htmlResponse(title: string, body: string, status: number): NextResponse {
  return new NextResponse(html(title, body), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

type UnsubscribeParams = { salonSlug: string; bookingId: string; token: string };

function paramsFromUrl(req: Request): UnsubscribeParams | null {
  const url = new URL(req.url);
  const salonSlug = url.searchParams.get("salon")?.trim() ?? "";
  const bookingId = url.searchParams.get("booking")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";
  if (!salonSlug || !SLUG_RE.test(salonSlug) || !bookingId || !token) return null;
  return { salonSlug, bookingId, token };
}

async function findBooking(p: UnsubscribeParams) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, salon_slug, email_unsubscribed, confirmation_token")
    .eq("salon_slug", p.salonSlug)
    .eq("id", p.bookingId)
    .eq("confirmation_token", p.token)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; email_unsubscribed: boolean };
}

export async function GET(req: Request) {
  const params = paramsFromUrl(req);
  if (!params) return htmlResponse("Грешка", "<p>Невалиден линк за отписване.</p>", 400);

  const booking = await findBooking(params);
  if (!booking) return htmlResponse("Невалиден линк", "<p>Линкът не е валиден или е изтекъл.</p>", 404);

  if (booking.email_unsubscribed) {
    return htmlResponse(
      "Вече отписан",
      "<p>Вече сте отписани от имейл напомняния за тази резервация.</p>",
      200
    );
  }

  const action = `/api/unsubscribe?salon=${encodeURIComponent(params.salonSlug)}&booking=${encodeURIComponent(params.bookingId)}&token=${encodeURIComponent(params.token)}`;
  return htmlResponse(
    "Отписване от напомняния",
    `<h2>Отписване от имейл напомняния</h2>
<p>Ако потвърдите, няма да получавате повече имейл напомняния за тази резервация.</p>
<form method="post" action="${action}">
  <button type="submit" style="padding:.65rem 1.25rem;font-size:1rem;border:0;border-radius:.5rem;background:#111;color:#fff;cursor:pointer">Отпиши ме</button>
</form>`,
    200
  );
}

export async function POST(req: Request) {
  const params = paramsFromUrl(req);
  if (!params) return htmlResponse("Грешка", "<p>Невалиден линк за отписване.</p>", 400);

  const booking = await findBooking(params);
  if (!booking) return htmlResponse("Невалиден линк", "<p>Линкът не е валиден или е изтекъл.</p>", 404);

  if (!booking.email_unsubscribed) {
    const supabase = createSupabaseServiceRoleClient();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ email_unsubscribed: true })
      .eq("salon_slug", params.salonSlug)
      .eq("id", params.bookingId)
      .eq("confirmation_token", params.token);

    if (updateError) {
      return htmlResponse("Грешка", "<p>Неуспешно отписване. Опитайте отново.</p>", 500);
    }
  }

  return htmlResponse(
    "Отписан успешно",
    "<h2>Отписан успешно ✓</h2><p>Няма да получавате повече имейл напомняния за тази резервация.</p>",
    200
  );
}
