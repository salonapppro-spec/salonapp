import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  copyStorageFolderToNewSlug,
  removeStoragePrefix,
  rewriteGalleryPathInUrl,
} from "@/lib/tenant-slug-rename";

type PgishError = { message: string; code?: string; details?: string; hint?: string };
type AuthUser = {
  id: string;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugFromMetadata(meta: Record<string, unknown> | null | undefined): string | null {
  const raw = typeof meta?.salon_slug === "string" ? meta.salon_slug.trim() : "";
  return raw && SLUG_RE.test(raw) ? raw : null;
}

async function listAllAuthUsers(admin: SupabaseClient): Promise<{ users: AuthUser[]; error?: string }> {
  const users: AuthUser[] = [];
  const perPage = 200;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return { users: [], error: `Грешка при четене на auth потребители: ${error.message}` };
    const chunk = (data?.users ?? []) as AuthUser[];
    users.push(...chunk);
    if (chunk.length < perPage) break;
    page += 1;
  }
  return { users };
}

async function syncOwnerMetadataForSlugRename(
  admin: SupabaseClient,
  oldSlug: string,
  newSlug: string
): Promise<{ updatedCount: number; error?: string }> {
  const { users, error } = await listAllAuthUsers(admin);
  if (error) return { updatedCount: 0, error };

  let updatedCount = 0;
  for (const user of users) {
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const appSlug = slugFromMetadata(appMeta);
    const userSlug = slugFromMetadata(userMeta);
    if (appSlug !== oldSlug && userSlug !== oldSlug) continue;

    const nextAppMeta = appSlug === oldSlug ? { ...appMeta, salon_slug: newSlug } : appMeta;
    const nextUserMeta = userSlug === oldSlug ? { ...userMeta, salon_slug: newSlug } : userMeta;

    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: nextAppMeta,
      user_metadata: nextUserMeta,
    });
    if (updErr) {
      return {
        updatedCount,
        error: `Базата е обновена, но auth metadata не успя за user ${user.id}: ${updErr.message}`,
      };
    }
    updatedCount += 1;
  }
  return { updatedCount };
}

function formatTenantSlugUpdateError(err: PgishError | null | undefined): string {
  if (!err?.message) return "Неуспешна смяна в базата. Моля, опитай пак.";

  const { message, code } = err;
  const m = message.toLowerCase();
  if (
    code === "23503" ||
    /foreign key|fk_|violate[s]? foreign|references.*tenants/i.test(message) ||
    m.includes("foreign key constraint")
  ) {
    return [
      "Базата не позволява да се смени slug, докато външните ключове към tenants(salon_slug) нямат ON UPDATE CASCADE.",
      "В Supabase Dashboard → SQL Editor: изпълни еднократно съдържанието на",
      "supabase/migrations/019_tenant_salon_slug_on_update_cascade.sql",
      "След това пак опитай смяната.",
      `(детайл: ${code ?? "?"} — ${message})`,
    ].join(" ");
  }

  return `Неуспешна смяна в базата: ${message}`;
}

/**
 * Смяна на `tenants.salon_slug` + storage + URL в полетата. Изисква service role client.
 * Връща `{ error }` при неуспех; иначе синхронизира auth metadata за ВСИЧКИ засегнати
 * потребители, които сочат към old slug (app_metadata и user_metadata).
 */
export async function performSalonSlugRename(
  admin: SupabaseClient,
  oldSlug: string,
  newSlug: string
): Promise<{ error?: string }> {
  if (oldSlug === newSlug) return { error: "Старият и новият адрес съвпадат." };

  const { data: currentTenant, error: curErr } = await admin
    .from("tenants")
    .select("id")
    .eq("salon_slug", oldSlug)
    .maybeSingle();
  if (curErr) return { error: "Проблем при проверка на салона." };
  if (!currentTenant) return { error: "Салон с този адрес не съществува." };

  const { data: taken } = await admin.from("tenants").select("id").eq("salon_slug", newSlug).maybeSingle();
  if (taken) return { error: "Този адрес вече е зает от друг салон." };

  const { error: copyErr } = await copyStorageFolderToNewSlug(admin, oldSlug, newSlug);
  if (copyErr) return { error: copyErr };

  const { error: updErr } = await admin.from("tenants").update({ salon_slug: newSlug }).eq("salon_slug", oldSlug);
  if (updErr) return { error: formatTenantSlugUpdateError(updErr as PgishError) };

  const { data: tr } = await admin
    .from("tenants")
    .select("id,logo_url,hero_image_url,about_image_url")
    .eq("salon_slug", newSlug)
    .maybeSingle();
  if (tr) {
    await admin
      .from("tenants")
      .update({
        logo_url: rewriteGalleryPathInUrl(tr.logo_url as string | null, oldSlug, newSlug),
        hero_image_url: rewriteGalleryPathInUrl(tr.hero_image_url as string | null, oldSlug, newSlug),
        about_image_url: rewriteGalleryPathInUrl(tr.about_image_url as string | null, oldSlug, newSlug),
      })
      .eq("id", tr.id);
  }

  const { data: gRows } = await admin.from("gallery").select("id,url").eq("salon_slug", newSlug);
  for (const g of gRows ?? []) {
    const nu = rewriteGalleryPathInUrl(g.url as string, oldSlug, newSlug);
    if (nu && nu !== g.url) {
      await admin.from("gallery").update({ url: nu }).eq("id", g.id);
    }
  }

  const { data: sRows } = await admin.from("specialists").select("id,avatar_url").eq("salon_slug", newSlug);
  for (const s of sRows ?? []) {
    const nu = rewriteGalleryPathInUrl(s.avatar_url as string | null, oldSlug, newSlug);
    if (nu !== s.avatar_url) {
      await admin.from("specialists").update({ avatar_url: nu }).eq("id", s.id);
    }
  }

  await removeStoragePrefix(admin, oldSlug);

  const { error: authSyncError } = await syncOwnerMetadataForSlugRename(admin, oldSlug, newSlug);
  if (authSyncError) return { error: authSyncError };

  const ssr = await createSupabaseServerClient();
  if (ssr) {
    const { data: u } = await ssr.auth.getUser();
    const appMetaSlug = slugFromMetadata((u.user?.app_metadata ?? null) as Record<string, unknown> | null);
    const userMetaSlug = slugFromMetadata((u.user?.user_metadata ?? null) as Record<string, unknown> | null);
    if (u.user && (appMetaSlug === oldSlug || userMetaSlug === oldSlug)) {
      await admin.auth.admin.updateUserById(u.user.id, {
        app_metadata: { ...(u.user.app_metadata ?? {}), salon_slug: newSlug },
        user_metadata: { ...(u.user.user_metadata ?? {}), salon_slug: newSlug },
      });
    }
  }

  revalidatePath("/", "layout");
  revalidatePath(`/${oldSlug}`);
  revalidatePath(`/${newSlug}`);
  revalidatePath(`/super-admin/${oldSlug}`);
  revalidatePath(`/super-admin/${newSlug}`);
  revalidatePath(`/super-admin/${newSlug}/builder`);
  revalidatePath(`/admin/settings`);

  return {};
}
