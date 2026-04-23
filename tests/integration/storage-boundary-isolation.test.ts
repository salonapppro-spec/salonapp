import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv } from "./helpers";

const supabaseUrl = requiredEnv("INTEGRATION_SUPABASE_URL");
const anonKey = requiredEnv("INTEGRATION_SUPABASE_ANON_KEY");
const tenantAJwt = requiredEnv("INTEGRATION_TENANT_A_SUPABASE_JWT");
const tenantASlug = requiredEnv("INTEGRATION_TENANT_A_SLUG");
const tenantBSlug = requiredEnv("INTEGRATION_TENANT_B_SLUG");
const bucket = requiredEnv("INTEGRATION_STORAGE_BUCKET");

function storageHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${tenantAJwt}`,
    apikey: anonKey,
    "Content-Type": "text/plain",
  };
}

async function upload(path: string): Promise<number> {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: storageHeaders(),
    body: `integration-${Date.now()}`,
  });
  return res.status;
}

async function remove(path: string): Promise<number> {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "DELETE",
    headers: storageHeaders(),
  });
  return res.status;
}

test("storage isolation: tenant A can upload only in own folder", async () => {
  const ownPath = `${tenantASlug}/integration/ok-${Date.now()}.txt`;
  const status = await upload(ownPath);
  assert.ok(status === 200 || status === 201, `Expected 200/201 for own path upload, got ${status}`);
});

test("storage isolation: tenant A cannot upload in tenant B folder", async () => {
  const foreignPath = `${tenantBSlug}/integration/deny-upload-${Date.now()}.txt`;
  const status = await upload(foreignPath);
  assert.ok(status === 401 || status === 403, `Expected 401/403 for foreign path upload, got ${status}`);
});

test("storage isolation: tenant A cannot delete from tenant B folder", async () => {
  const foreignPath = `${tenantBSlug}/integration/deny-delete-${Date.now()}.txt`;
  const status = await remove(foreignPath);
  assert.ok(status === 401 || status === 403, `Expected 401/403 for foreign path delete, got ${status}`);
});

