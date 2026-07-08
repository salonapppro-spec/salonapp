import { NextResponse } from "next/server";

import { getTenantBackupById } from "@/lib/internal/tenant-backups";
import { requireSuperAdminForApi } from "@/lib/super-admin-auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Сваляне на пълен бекъп като JSON файл — само super_admin.
 * Дава offline копие извън Supabase (disaster recovery отвъд самата база).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdminForApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Невалиден бекъп id." }, { status: 400 });
  }

  const backup = await getTenantBackupById(id);
  if (!backup) {
    return NextResponse.json({ error: "Бекъпът не е намерен." }, { status: 404 });
  }

  const filename = `salonapp-backup-${backup.salon_slug}-${backup.backup_date}-${backup.id.slice(0, 8)}.json`;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
