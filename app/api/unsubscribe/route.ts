import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { SLUG_RE } from "@/lib/routing/constants";

export const dynamic = "force-dynamic";

function html(title: string, body: string) {
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:0 auto;line-height:1.5">${body}</body></html>`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const salonSlug = url.searchParams.get("salon")?.trim() ?? "";
  const bookingId = url.searchParams.get("booking")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";

  if (!salonSlug || !SLUG_RE.test(salonSlug) || !bookingId || !token) {
    return new NextResponse(html("Грешка", "<p>Невалиден линк за отписване.</p>"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, salon_slug, email_unsubscribed, confirmation_token")
    .eq("salon_slug", salonSlug)
    .eq("id", bookingId)
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error || !booking) {
    return new NextResponse(html("Невалиден линк", "<p>Линкът не е валиден или е изтекъл.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (booking.email_unsubscribed) {
    return new NextResponse(
      html("Вече отписан", "<p>Вече сте отписани от имейл напомняния за тази резервация.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ email_unsubscribed: true })
    .eq("salon_slug", salonSlug)
    .eq("id", bookingId)
    .eq("confirmation_token", token);

  if (updateError) {
    return new NextResponse(html("Грешка", "<p>Неуспешно отписване. Опитайте отново.</p>"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(
    html(
      "Отписан успешно",
      "<h2>Отписан успешно ✓</h2><p>Няма да получавате повече имейл напомняния за тази резервация.</p>"
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
