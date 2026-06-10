import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const TrackSchema = z.object({
  event_type: z.enum(["visitor", "cta_click", "form_filled"]),
  source: z.string().trim().max(80).optional(),
});

function hostOnly(host: string | null): string {
  return (host ?? "").split(":")[0].toLowerCase();
}

function isAllowedHost(host: string): boolean {
  if (host === "salonapp.pro" || host === "www.salonapp.pro") return true;
  if (host.endsWith(".vercel.app")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}

export async function POST(req: Request) {
  const host = hostOnly(req.headers.get("host"));
  if (!isAllowedHost(host)) {
    return NextResponse.json({ error: "Forbidden host" }, { status: 403 });
  }
  const originRaw = req.headers.get("origin");
  const refererRaw = req.headers.get("referer");
  const parseHost = (raw: string | null): string | null => {
    if (!raw) return null;
    try {
      return hostOnly(new URL(raw).host);
    } catch {
      return null;
    }
  };
  const originHost = parseHost(originRaw);
  const refererHost = parseHost(refererRaw);
  if (originHost && !isAllowedHost(originHost)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }
  if (!originHost && refererHost && !isAllowedHost(refererHost)) {
    return NextResponse.json({ error: "Forbidden referer" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("page_events").insert({
    event_type: parsed.data.event_type,
    source: parsed.data.source ?? host,
  });
  if (error) return NextResponse.json({ error: "Insert failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
