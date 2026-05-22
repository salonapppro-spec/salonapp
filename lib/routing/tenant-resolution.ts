/**
 * lib/routing/tenant-resolution.ts
 *
 * Edge-safe tenant lookup via Supabase REST (no SDK — works in Edge runtime).
 * This is the ONLY module (besides middleware.ts itself) that performs network I/O.
 *
 * Calls the resolve_tenant_public RPC which returns { salon_slug, status }.
 * No auth user context. No impersonation. Pure tenant→slug resolution.
 */

export type ResolvedTenant = { salon_slug: string; status: string } | null;

/**
 * Resolves a tenant by salon slug (subdomain) or custom domain.
 * Exactly one of salonSlug / domain must be provided — not both.
 */
export async function resolveTenantFromHost(params: {
  supabaseUrl: string;
  anonKey: string;
  salonSlug?: string;
  domain?: string;
}): Promise<ResolvedTenant> {
  const { supabaseUrl, anonKey, salonSlug, domain } = params;

  // Mutual exclusion — exactly one lookup key
  if ((!salonSlug && !domain) || (salonSlug && domain)) return null;

  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/resolve_tenant_public`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_salon_slug: salonSlug ?? null,
        p_domain: domain ?? null,
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as unknown;
    if (!Array.isArray(json) || json.length === 0) return null;

    const first = json[0] as { salon_slug?: unknown; status?: unknown };
    if (typeof first.salon_slug !== "string" || !first.salon_slug) return null;

    const status = typeof first.status === "string" ? first.status : "active";
    return { salon_slug: first.salon_slug, status };
  } catch {
    return null;
  }
}
