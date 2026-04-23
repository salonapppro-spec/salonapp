import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.ADMIN_GALLERY_BUCKET ?? "gallery";

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replaces `gallery/{old}/` with `gallery/{new}/` in a Supabase public storage URL.
 */
export function rewriteGalleryPathInUrl(url: string | null | undefined, oldSlug: string, newSlug: string): string | null {
  if (url == null || String(url).trim() === "") return null;
  const u = String(url);
  const pat = new RegExp(`${escapeRe(`gallery/${oldSlug}/`)}`, "g");
  if (pat.test(u)) {
    return u.replace(pat, `gallery/${newSlug}/`);
  }
  return u;
}

type ListItem = { name: string; id: string | null; metadata: Record<string, unknown> | null };

/** Lists all file paths (relative to bucket) under `prefix/`. */
export async function listStorageFilesRecursive(
  supabase: SupabaseClient,
  prefix: string,
  acc: string[] = []
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return acc;
  for (const raw of data) {
    const item = raw as ListItem;
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      acc.push(full);
    } else {
      await listStorageFilesRecursive(supabase, full, acc);
    }
  }
  return acc;
}

/**
 * Копира всички обекти от `oldSlug/…` в `newSlug/…` в същия bucket.
 * Преди `copy` премахваме целевия път, ако е останал от неуспял/частичен опит
 * (Storage връща „The resource already exists“).
 */
export async function copyStorageFolderToNewSlug(
  supabase: SupabaseClient,
  oldSlug: string,
  newSlug: string
): Promise<{ error?: string }> {
  if (oldSlug === newSlug) return {};
  const files = await listStorageFilesRecursive(supabase, oldSlug);
  for (const fromPath of files) {
    const segs = fromPath.split("/");
    if (segs[0] !== oldSlug) continue;
    segs[0] = newSlug;
    const toPath = segs.join("/");
    // best-effort: няма опасност да изтрием „грешна“ съдбина, защото toPath държи същото име като fromPath, само slug-папката е сменена
    await supabase.storage.from(BUCKET).remove([toPath]);
    const { error } = await supabase.storage.from(BUCKET).copy(fromPath, toPath);
    if (error) {
      return { error: `Storage copy failed (${fromPath}): ${error.message}` };
    }
  }
  return {};
}

export async function removeStoragePrefix(supabase: SupabaseClient, prefix: string): Promise<void> {
  const files = await listStorageFilesRecursive(supabase, prefix);
  if (files.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(files);
  if (error) {
    console.warn(`[slug-rename] remove old storage prefix: ${error.message}`);
  }
}
