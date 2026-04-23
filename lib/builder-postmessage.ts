/**
 * Origins that may postMessage live design tokens to the public salon page (the iframe child).
 * The child must only accept `builder-preview` from these origins — not "*".
 * Include the deployment that serves `/super-admin/.../builder` (see NEXT_PUBLIC_APP_URL, VERCEL_URL).
 */
export function builderPostMessageParentOrigins(): string[] {
  const out = new Set<string>();
  // Production super-admin origins (always allow, regardless of env setup).
  out.add("https://salonapp.pro");
  out.add("https://www.salonapp.pro");

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
  for (const o of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ]) {
    out.add(o);
  }
  return Array.from(out);
}
