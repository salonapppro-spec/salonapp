import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  copyStorageFolderToNewSlug,
  removeStoragePrefix,
  rewriteGalleryPathInUrl,
} from "@/lib/tenant-slug-rename";

/**
 * Смяна на `tenants.salon_slug` + storage + URL в полетата. Изисква service role client.
 * Връща `{ error }` при неуспех; иначе обновява и metadata на текущата сесия, само ако
 * потребителят вече има `salon_slug === oldSlug` (собственик) — super_admin без този slug не се пипа.
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
  if (updErr) return { error: "Неуспешна смяна в базата. Моля, опитай пак." };

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

  const ssr = await createSupabaseServerClient();
  if (ssr) {
    const { data: u } = await ssr.auth.getUser();
    if (u.user) {
      const am = (u.user.app_metadata ?? {}) as Record<string, unknown>;
      const um = (u.user.user_metadata ?? {}) as Record<string, unknown>;
      const fromAm = typeof am.salon_slug === "string" ? am.salon_slug : null;
      const fromUm = typeof um.salon_slug === "string" ? um.salon_slug : null;
      if (fromAm === oldSlug || fromUm === oldSlug) {
        await admin.auth.admin.updateUserById(u.user.id, {
          app_metadata: { ...am, salon_slug: newSlug },
          user_metadata: { ...um, salon_slug: newSlug },
        });
      }
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
