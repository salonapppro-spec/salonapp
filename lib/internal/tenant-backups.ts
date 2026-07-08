import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

export type TenantBackupMeta = {
  id: string;
  salon_slug: string;
  backup_date: string;
  source: "cron" | "manual";
  row_counts: Record<string, number>;
  created_at: string;
};

export type TenantBackupFull = TenantBackupMeta & {
  tables: Record<string, unknown>;
};

/** Последните бекъпи на тенант (без тежкия JSONB payload). */
export async function listTenantBackups(salonSlug: string, limit = 15): Promise<TenantBackupMeta[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tenant_backups")
    .select("id,salon_slug,backup_date,source,row_counts,created_at")
    .eq("salon_slug", salonSlug)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Неуспешно четене на бекъпи: ${error.message}`);
  return (data ?? []) as TenantBackupMeta[];
}

/** Пълен бекъп (с данните) — за download от супер-админа. */
export async function getTenantBackupById(id: string): Promise<TenantBackupFull | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tenant_backups")
    .select("id,salon_slug,backup_date,source,row_counts,created_at,tables")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Неуспешно четене на бекъп: ${error.message}`);
  return (data as TenantBackupFull | null) ?? null;
}
