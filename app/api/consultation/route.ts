import { NextResponse } from "next/server";
import { z } from "zod";

import { sendLeadNotification } from "@/lib/lead-notify";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const ConsultationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  // eventId идва от браузър пиксела (fbq Lead) за дедупликация с CAPI
  eventId: z.string().trim().max(100).optional(),
});

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = ConsultationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невалидни данни" }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("platform_leads").insert({
    plan: "starter",
    salon_name: `Consultation — ${parsed.data.name}`,
    contact_name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    source: "other",
    message: "Landing consultation form",
  });
  if (error) {
    return NextResponse.json({ error: "Неуспешно изпращане" }, { status: 500 });
  }

  await supabase.from("page_events").insert({
    event_type: "form_filled",
    source: "landing_consultation",
  });

  // Meta CAPI — server-side Lead. No-op докато META_* env няма стойност.
  // eventId се дедупликира с браузър пиксела (fbq('track','Lead',{},{eventID})).
  await sendMetaCapiEvent({
    eventName: "Lead",
    eventId: parsed.data.eventId,
    eventSourceUrl: req.headers.get("referer") ?? undefined,
    user: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    },
    request: req,
  });

  await sendLeadNotification({
    subject: `Нова tenant заявка (consultation): ${parsed.data.name}`,
    lines: [
      `Контакт: ${parsed.data.name}`,
      `Имейл: ${parsed.data.email}`,
      `Телефон: ${parsed.data.phone ?? "—"}`,
      "Източник: landing_consultation",
    ],
  });

  return NextResponse.json({ ok: true });
}
