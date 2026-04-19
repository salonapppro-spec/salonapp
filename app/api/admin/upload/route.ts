import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

const BUCKET = process.env.ADMIN_GALLERY_BUCKET ?? "gallery";

/**
 * Generic image upload for settings (logo, hero, about etc.)
 * Uploads to Supabase Storage, returns public URL — does NOT insert into gallery table.
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
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Макс. 8 MB" }, { status: 400 });
  }

  const mime = file.type || "image/jpeg";
  if (!mime.startsWith("image/")) {
    return NextResponse.json({ error: "Само изображения" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${salonSlug}/settings/${randomUUID()}.${ext}`;

  const supabase = createSupabaseServiceRoleClient();
  const { data: up, error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: mime,
    upsert: false,
  });

  if (upErr || !up) {
    return NextResponse.json({ error: "Качването не успя. Проверете Supabase Storage bucket." }, { status: 501 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(up.path);
  return NextResponse.json({ url: pub.publicUrl });
}
