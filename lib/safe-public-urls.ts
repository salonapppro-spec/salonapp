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

/**
 * Allowed Google Maps iframe sources:
 * - Share → Embed (`https://www.google.com/maps/embed?pb=…`)
 * - Legacy framed search (`https://maps.google.com/maps?q=…&output=embed`) — reliably loads in iframe
 */
export function isSafeGoogleMapsEmbedUrl(raw: string): boolean {
  const u = isHttpsUrlWithNoCredentials(raw.trim());
  if (!u) return false;
  if (raw.length > 2000) return false;

  const host = u.hostname.toLowerCase();
  const path = ((u.pathname.replace(/\/$/, "") || "/").toLowerCase());

  if (host === "www.google.com") {
    if (path !== "/maps/embed") return false;
    if (!u.search || u.search.length < 2) return false;
    return true;
  }

  if (host === "maps.google.com" && path === "/maps") {
    const output = u.searchParams.get("output")?.toLowerCase();
    if (output !== "embed") return false;
    const hasDestination =
      u.searchParams.has("q") ||
      u.searchParams.has("query") ||
      u.searchParams.has("sll") ||
      u.searchParams.has("ll") ||
      u.searchParams.has("cid") ||
      u.searchParams.has("pb");
    return hasDestination;
  }

  return false;
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
