import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { requireAdminCapabilityForApi } from "@/lib/admin-rbac";
import { processAdminImageUpload } from "@/lib/safe-image-upload";
import { tenantDb } from "@/lib/tenant-db";

const BUCKET = process.env.ADMIN_GALLERY_BUCKET ?? "gallery";

/**
 * Multipart: поле `file` — качва в Supabase Storage (публичен bucket `gallery` или ADMIN_GALLERY_BUCKET).
 */
export async function POST(req: Request) {
  const a = await requireAdminCapabilityForApi("gallery_write");
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
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(mime.trim().toLowerCase())) {
    return NextResponse.json({ error: "Само изображения (JPG, PNG, WebP)" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const processed = await processAdminImageUpload(buf, mime);
  if (!processed.ok) {
    return NextResponse.json({ error: processed.message }, { status: 400 });
  }
  const path = `${salonSlug}/${randomUUID()}.${processed.extension}`;

  const db = tenantDb(salonSlug);
  const { data: up, error: upErr } = await db.storage.uploadImage(BUCKET, path, processed.buffer, processed.contentType);

  if (upErr || !up) {
    return NextResponse.json(
      {
        error:
          "Качването не успя. Създайте публичен bucket „gallery“ в Supabase Storage или задайте ADMIN_GALLERY_BUCKET.",
      },
      { status: 501 }
    );
  }

  const { data: pub } = db.storage.getPublicUrl(BUCKET, up.path);
  const publicUrl = pub.publicUrl;

  const { count } = await db.gallery.count();
  const orderIndex = (count ?? 0) + 1;

  const { data: row, error: insErr } = await db.gallery.create({
    url: publicUrl,
    order_index: orderIndex,
    is_visible: true,
  });

  if (insErr) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });

  return NextResponse.json({ item: row });
}
