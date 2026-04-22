import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const BUCKET = process.env.ADMIN_GALLERY_BUCKET ?? "gallery";

/**
 * Multipart: поле `file` — качва в Supabase Storage (публичен bucket `gallery` или ADMIN_GALLERY_BUCKET).
 */
export async function POST(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;
  const salonSlug = a.slug;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Липсва файл" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Макс. 5 MB" }, { status: 400 });
  }

  const mime = file.type;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(mime)) {
    return NextResponse.json({ error: "Само изображения (JPG, PNG, WebP)" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = mime.split("/")[1] ?? "bin";
  const path = `${salonSlug}/${randomUUID()}.${ext}`;

  const supabase = createSupabaseServiceRoleClient();
  const { data: up, error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: mime,
    upsert: false,
  });

  if (upErr || !up) {
    return NextResponse.json(
      {
        error:
          "Качването не успя. Създайте публичен bucket „gallery“ в Supabase Storage или задайте ADMIN_GALLERY_BUCKET.",
      },
      { status: 501 }
    );
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(up.path);
  const publicUrl = pub.publicUrl;

  const { count } = await supabase
    .from("gallery")
    .select("*", { count: "exact", head: true })
    .eq("salon_slug", salonSlug);
  const orderIndex = (count ?? 0) + 1;

  const { data: row, error: insErr } = await supabase
    .from("gallery")
    .insert({
      salon_slug: salonSlug,
      url: publicUrl,
      order_index: orderIndex,
      is_visible: true,
    })
    .select("*")
    .maybeSingle();

  if (insErr) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });

  return NextResponse.json({ item: row });
}
