import assert from "node:assert/strict";
import test from "node:test";

import { requiredEnv } from "./helpers";

const supabaseUrl = requiredEnv("INTEGRATION_SUPABASE_URL");
const anonKey = requiredEnv("INTEGRATION_SUPABASE_ANON_KEY");

test("RLS regression: anon cannot read tenant_activity_logs", async () => {
  const res = await fetch(`${supabaseUrl}/rest/v1/tenant_activity_logs?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: "application/json",
    },
  });

  assert.ok(res.ok, `PostgREST should respond OK with empty set, got ${res.status}`);
  const rows = await res.json();
  assert.ok(Array.isArray(rows), "Expected array response");
  assert.equal(rows.length, 0, "Anon must not read tenant_activity_logs rows");
});

test("RLS regression: anon cannot read lead_call_tasks", async () => {
  const res = await fetch(`${supabaseUrl}/rest/v1/lead_call_tasks?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: "application/json",
    },
  });

  assert.ok(res.ok, `PostgREST should respond OK with empty set, got ${res.status}`);
  const rows = await res.json();
  assert.ok(Array.isArray(rows));
  assert.equal(rows.length, 0);
});
