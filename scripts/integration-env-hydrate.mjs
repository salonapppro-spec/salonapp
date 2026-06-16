/**
 * Resolves integration test env: static secrets from GitHub + fresh admin JWT when possible.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const CI_USER_EMAIL = "github-actions-integration@salonapp.pro";
const CI_USER_PASSWORD_ENV = "INTEGRATION_CI_USER_PASSWORD";

export async function loadLocalEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const raw = await readFile(envPath, "utf8");
    return parseEnvFile(raw);
  } catch {
    return {};
  }
}

export function parseEnvFile(content) {
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function supabaseRest(serviceRoleKey, baseUrl, pathSuffix, query = "") {
  const res = await fetch(`${baseUrl}/rest/v1/${pathSuffix}${query}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${pathSuffix} failed (${res.status}): ${text.slice(0, 240)}`);
  }
  return res.json();
}

async function adminUpsertCiUser({ baseUrl, serviceRoleKey, anonKey, salonSlug, password }) {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  const listRes = await fetch(
    `${baseUrl}/auth/v1/admin/users?email=${encodeURIComponent(CI_USER_EMAIL)}`,
    { headers }
  );
  if (!listRes.ok) {
    const text = await listRes.text();
    throw new Error(`Admin list users failed (${listRes.status}): ${text.slice(0, 240)}`);
  }
  const listed = await listRes.json();
  const existing = listed?.users?.[0];

  const body = {
    email: CI_USER_EMAIL,
    password,
    email_confirm: true,
    app_metadata: { salon_slug: salonSlug, role: "owner" },
  };

  if (existing?.id) {
    const updateRes = await fetch(`${baseUrl}/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    if (!updateRes.ok) {
      const text = await updateRes.text();
      throw new Error(`Admin update user failed (${updateRes.status}): ${text.slice(0, 240)}`);
    }
  } else {
    const createRes = await fetch(`${baseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Admin create user failed (${createRes.status}): ${text.slice(0, 240)}`);
    }
  }

  const signInRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: CI_USER_EMAIL, password }),
  });
  if (!signInRes.ok) {
    const text = await signInRes.text();
    throw new Error(`CI user sign-in failed (${signInRes.status}): ${text.slice(0, 240)}`);
  }
  const session = await signInRes.json();
  return session.access_token;
}

export async function hydrateIntegrationEnvFromDatabase() {
  const supabaseUrl = process.env.INTEGRATION_SUPABASE_URL?.trim();
  const anonKey = process.env.INTEGRATION_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey =
    process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return;
  }

  if (!process.env.INTEGRATION_TENANT_A_SLUG?.trim() || !process.env.INTEGRATION_TENANT_B_SLUG?.trim()) {
    const tenants = await supabaseRest(
      serviceRoleKey,
      supabaseUrl,
      "tenants",
      "?select=salon_slug,status&status=eq.active&order=salon_slug.asc&limit=10"
    );
    if (Array.isArray(tenants) && tenants.length >= 2) {
      process.env.INTEGRATION_TENANT_A_SLUG ??= tenants[0].salon_slug;
      process.env.INTEGRATION_TENANT_B_SLUG ??= tenants[1].salon_slug;
    }
  }

  const tenantASlug = process.env.INTEGRATION_TENANT_A_SLUG?.trim();
  const tenantBSlug = process.env.INTEGRATION_TENANT_B_SLUG?.trim();
  if (!tenantASlug || !tenantBSlug) return;

  process.env.INTEGRATION_BASE_URL ??= "https://salonapp.pro";
  process.env.INTEGRATION_PUBLIC_TENANT_BASE_URL ??= `https://${tenantASlug}.salonapp.pro`;
  process.env.INTEGRATION_STORAGE_BUCKET ??= "salon-assets";

  if (!process.env.INTEGRATION_TEST_DATE?.trim()) {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    process.env.INTEGRATION_TEST_DATE = d.toISOString().slice(0, 10);
  }

  if (!process.env.INTEGRATION_TENANT_B_CLIENT_ID?.trim()) {
    const clientsB = await supabaseRest(
      serviceRoleKey,
      supabaseUrl,
      "clients",
      `?select=id&salon_slug=eq.${encodeURIComponent(tenantBSlug)}&limit=1`
    );
    if (clientsB[0]?.id) process.env.INTEGRATION_TENANT_B_CLIENT_ID = clientsB[0].id;
  }

  if (!process.env.INTEGRATION_TENANT_B_BOOKING_ID?.trim()) {
    const bookingsB = await supabaseRest(
      serviceRoleKey,
      supabaseUrl,
      "bookings",
      `?select=id&salon_slug=eq.${encodeURIComponent(tenantBSlug)}&limit=1`
    );
    if (bookingsB[0]?.id) process.env.INTEGRATION_TENANT_B_BOOKING_ID = bookingsB[0].id;
  }

  const needsBearer =
    !process.env.INTEGRATION_TENANT_A_BEARER?.trim() && !process.env.INTEGRATION_TENANT_A_COOKIE?.trim();
  const needsJwt = !process.env.INTEGRATION_TENANT_A_SUPABASE_JWT?.trim();

  if (needsBearer || needsJwt) {
    const password =
      process.env[CI_USER_PASSWORD_ENV]?.trim() ||
      process.env.INTEGRATION_CI_USER_PASSWORD?.trim() ||
      "SalonApp-CI-Integration-2026!";
    const token = await adminUpsertCiUser({
      baseUrl: supabaseUrl,
      serviceRoleKey,
      anonKey,
      salonSlug: tenantASlug,
      password,
    });
    if (needsBearer) process.env.INTEGRATION_TENANT_A_BEARER = token;
    if (needsJwt) process.env.INTEGRATION_TENANT_A_SUPABASE_JWT = token;
  }
}
