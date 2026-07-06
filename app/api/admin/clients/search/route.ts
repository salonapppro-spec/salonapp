import { NextResponse } from "next/server";

import { requireAdminTenantSlugForApi } from "@/lib/admin-tenant";
import { tenantDb } from "@/lib/tenant-db";
import type { Client } from "@/types";

/**
 * Цифрови варианти на телефонно търсене: клиентите са записани нормализирано
 * (+359888123456), но админът пише "0888 123 456". Генерираме еквивалентните
 * префикси, за да match-не частичното въвеждане и в двата формата.
 */
function phoneDigitVariants(raw: string): string[] {
  const digits = raw.replace(/\D+/g, "");
  if (digits.length < 3) return [];
  const variants = new Set<string>([digits]);
  if (digits.startsWith("00359")) variants.add(digits.slice(2)); // 00359… → 359…
  if (digits.startsWith("0") && !digits.startsWith("00")) variants.add("359" + digits.slice(1)); // 0888… → 359888…
  if (digits.startsWith("359")) variants.add("0" + digits.slice(3)); // 359888… → 0888…
  return [...variants];
}

export async function GET(req: Request) {
  const a = await requireAdminTenantSlugForApi();
  if (!a.ok) return a.response;

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 1) return NextResponse.json([]);

  const { data, error } = await tenantDb(a.slug).clients.searchSuggest(q, phoneDigitVariants(q));
  if (error) return NextResponse.json([], { status: 500 });

  const results = ((data ?? []) as Client[]).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone ?? "",
    email: c.email ?? "",
  }));

  return NextResponse.json(results);
}
