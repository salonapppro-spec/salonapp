/**
 * Defense-in-depth URL checks for tenant-facing fields (social + Google Maps embed).
 * Used by Zod schemas on save and by public templates at render time (legacy DB rows).
 */

function hostUnderRoot(hostname: string, root: string): boolean {
  const h = hostname.toLowerCase();
  const r = root.toLowerCase();
  return h === r || h.endsWith(`.${r}`);
}

function isHttpsUrlWithNoCredentials(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

export function isSafeInstagramUrl(raw: string): boolean {
  const u = isHttpsUrlWithNoCredentials(raw.trim());
  if (!u) return false;
  return hostUnderRoot(u.hostname, "instagram.com");
}

export function isSafeFacebookUrl(raw: string): boolean {
  const u = isHttpsUrlWithNoCredentials(raw.trim());
  if (!u) return false;
  return hostUnderRoot(u.hostname, "facebook.com") || hostUnderRoot(u.hostname, "fb.com");
}

export function isSafeTiktokUrl(raw: string): boolean {
  const u = isHttpsUrlWithNoCredentials(raw.trim());
  if (!u) return false;
  return hostUnderRoot(u.hostname, "tiktok.com");
}

/** Only official Google Maps HTML embed (query required). */
export function isSafeGoogleMapsEmbedUrl(raw: string): boolean {
  const u = isHttpsUrlWithNoCredentials(raw.trim());
  if (!u) return false;
  if (u.hostname.toLowerCase() !== "www.google.com") return false;
  const path = u.pathname.replace(/\/$/, "") || "/";
  if (path.toLowerCase() !== "/maps/embed") return false;
  if (!u.search || u.search.length < 2) return false;
  if (raw.length > 2000) return false;
  return true;
}

export function safeInstagramHref(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  return isSafeInstagramUrl(t) ? t : null;
}

export function safeFacebookHref(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  return isSafeFacebookUrl(t) ? t : null;
}

export function safeTiktokHref(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  return isSafeTiktokUrl(t) ? t : null;
}

export function safeGoogleMapsEmbedSrc(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  return isSafeGoogleMapsEmbedUrl(t) ? t : null;
}
