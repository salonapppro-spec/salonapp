import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { processAdminImageUpload } from "@/lib/safe-image-upload";
import { tenantDb } from "@/lib/tenant-db";

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

  const mime = file.type;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(mime.trim().toLowerCase())) {
    return NextResponse.json({ error: "Само изображения (JPG, PNG, WebP)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const processed = await processAdminImageUpload(buf, mime);
  if (!processed.ok) {
    return NextResponse.json({ error: processed.message }, { status: 400 });
  }

  const path = `${salonSlug}/settings/${randomUUID()}.${processed.extension}`;

  const db = tenantDb(salonSlug);
  const { data: up, error: upErr } = await db.storage.uploadImage(BUCKET, path, processed.buffer, processed.contentType);

  if (upErr || !up) {
    return NextResponse.json({ error: "Качването не успя. Проверете Supabase Storage bucket." }, { status: 501 });
  }

  const { data: pub } = db.storage.getPublicUrl(BUCKET, up.path);
  return NextResponse.json({ url: pub.publicUrl });
}
