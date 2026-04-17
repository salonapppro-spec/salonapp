import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:0 auto;line-height:1.5">${body}</body></html>`;
}

export async function GET(_req: Request, ctx: { params: { token: string } }) {
  const token = decodeURIComponent(ctx.params.token ?? "").trim();
  if (!token) {
    return new NextResponse(htmlPage("Грешка", "<p>Невалиден линк.</p>"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id,status")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error || !booking) {
    return new NextResponse(htmlPage("Не е намерено", "<p>Резервацията не е намерена.</p>"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const row = booking as { id: string; status: string };
  if (row.status === "cancelled" || row.status === "no_show") {
    return new NextResponse(
      htmlPage("Отказана резервация", "<p>Тази резервация вече не е активна.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { error: upErr } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (upErr) {
    return new NextResponse(htmlPage("Грешка", "<p>Неуспешно потвърждение. Опитайте отново.</p>"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(
    htmlPage("Потвърдено", "<p><strong>Благодарим!</strong> Присъствието ви е потвърдено.</p>"),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
