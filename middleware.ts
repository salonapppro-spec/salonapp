import { NextRequest, NextResponse } from "next/server";

function normalizeHostname(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function isRootDomain(hostname: string): boolean {
  return hostname === "salonapp.pro" || hostname === "www.salonapp.pro";
}

function isDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

async function resolveTenant(params: {
  supabaseUrl: string;
  anonKey: string;
  salonSlug?: string;
  domain?: string;
}): Promise<{ salon_slug: string } | null> {
  const { supabaseUrl, anonKey, salonSlug, domain } = params;

  if ((!salonSlug && !domain) || (salonSlug && domain)) return null;

  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/tenants`);
  url.searchParams.set("select", "salon_slug");
  url.searchParams.set("limit", "1");
  if (salonSlug) url.searchParams.set("salon_slug", `eq.${salonSlug}`);
  if (domain) url.searchParams.set("domain", `eq.${domain}`);

  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json) || json.length === 0) return null;
  const first = json[0] as { salon_slug?: unknown };
  if (typeof first.salon_slug !== "string" || !first.salon_slug) return null;
  return { salon_slug: first.salon_slug };
}

export async function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") ?? "";
  const hostname = normalizeHostname(hostHeader);

  // Local development: keep things simple and let the app render.
  if (isDevHost(hostname)) return NextResponse.next();

  // Root domain serves the marketing site.
  if (isRootDomain(hostname)) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env isn't configured yet, don't block rendering.
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next();

  let salonSlug: string | undefined;
  let byDomain: string | undefined;

  if (hostname.endsWith(".salonapp.pro")) {
    salonSlug = hostname.replace(/\.salonapp\.pro$/, "");
  } else {
    byDomain = hostname;
  }

  const tenant = await resolveTenant({
    supabaseUrl,
    anonKey: supabaseAnonKey,
    salonSlug,
    domain: byDomain,
  });

  if (!tenant) {
    const url = new URL("https://salonapp.pro");
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set("x-salon-slug", tenant.salon_slug);
  if (byDomain) headers.set("x-tenant-domain", byDomain);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and static assets.
     */
    "/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};

