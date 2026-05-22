/**
 * lib/routing/preview.ts
 *
 * Path-based tenant slug resolution for dev and Vercel preview environments.
 * Pure function — no I/O.
 *
 * Usage: localhost:3000/paw-empire/... → resolvePreviewSlug("/paw-empire/...") → "paw-empire"
 */

import { RESERVED_PATHS, SLUG_RE } from "./constants";

/**
 * Extracts the tenant slug from the first path segment.
 * Returns null if the segment is reserved, contains a dot, or is empty.
 *
 * Rules (identical to current middleware):
 *  - First non-empty path segment
 *  - Not in RESERVED_PATHS
 *  - No dot in the segment (avoids matching filenames like "favicon.ico")
 */
export function resolvePreviewSlug(pathname: string): string | null {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (!first || RESERVED_PATHS.has(first) || first.includes(".") || !SLUG_RE.test(first)) return null;
  return first;
}
