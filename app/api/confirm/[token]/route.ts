import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:0 auto;line-height:1.5">${body}</body></html>`;
}

async function findBooking(token: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id,status")
    .eq("confirmation_token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; status: string };
}

// GET — показва страница с бутон за потвърждение
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

  if (booking.status === "confirmed") {
    return new NextResponse(
      htmlPage("Вече потвърдено", "<p>Присъствието ви вече е потвърдено. Благодарим!</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (booking.status === "cancelled" || booking.status === "no_show" || booking.status === "completed") {
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

  if (booking.status === "confirmed") {
    return new NextResponse(
      htmlPage("Вече потвърдено", "<p>Присъствието ви вече е потвърдено. Благодарим!</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (booking.status === "cancelled" || booking.status === "no_show" || booking.status === "completed") {
    return new NextResponse(
      htmlPage("Отказана резервация", "<p>Тази резервация вече не е активна.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Атомарен conditional UPDATE — eq("status", "pending") гарантира, че
  // token-ът прави прехода само веднъж (race-safe: ако статусът се е
  // променил между SELECT-а по-горе и тук, update-ът просто не пипа ред).
  const supabase = createSupabaseServiceRoleClient();
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", booking.id)
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
    // Между SELECT и UPDATE статусът се е променил (race) — третираме като
    // "вече обработено", не като грешка.
    return new NextResponse(
      htmlPage("Вече обработено", "<p>Тази резервация вече е обработена.</p>"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    htmlPage("Потвърдено ✓", "<p><strong>Благодарим!</strong> Присъствието ви е потвърдено.</p>"),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
