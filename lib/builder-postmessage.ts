/**
 * Origins that may postMessage live design tokens to the public salon page (the iframe child).
 * The child must only accept `builder-preview` from these origins — not "*".
 * Include the deployment that serves `/super-admin/.../builder` (see NEXT_PUBLIC_APP_URL, VERCEL_URL).
 *
 * For custom domain deployments add BUILDER_EXTRA_ORIGINS (comma-separated origins):
 *   BUILDER_EXTRA_ORIGINS=https://www.mybrand.bg,https://mybrand.bg
 */
export function builderPostMessageParentOrigins(): string[] {
  const out = new Set<string>();

  const app = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (app) {
    try {
      const href = app.startsWith("http://") || app.startsWith("https://") ? app : `https://${app}`;
      out.add(new URL(href).origin);
    } catch {
      // ignore bad env
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      out.add(new URL(`https://${vercel}`).origin);
    } catch {
      // ignore
    }
  }

  // Custom domain overrides (e.g. when builder is served from a non-salonapp.pro domain)
  const extra = process.env.BUILDER_EXTRA_ORIGINS?.trim();
  if (extra) {
    for (const raw of extra.split(",")) {
      const o = raw.trim();
      if (!o) continue;
      try {
        out.add(new URL(o).origin);
      } catch {
        // ignore malformed entries
      }
    }
  }

  for (const o of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ]) {
    out.add(o);
  }

  return Array.from(out);
}
