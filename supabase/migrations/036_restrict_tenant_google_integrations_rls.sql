-- Migration 036: restrict tenant_google_integrations RLS (audit 2026-06-16)
--
-- tenant_google_integrations_owner_all (FOR ALL TO authenticated) let a
-- salon owner SELECT their own row directly via PostgREST — including the
-- encrypted OAuth refresh/access token columns. Postgres RLS policies are
-- row-level only (no column-level restriction), and no application code
-- currently reads/writes this table at all (Google Calendar sync was
-- scaffolded in migration 035 but never wired into the app — Rule 5).
--
-- Closing the owner-level policy entirely is safe: nothing in the codebase
-- depends on direct owner/authenticated access to this table today. Any
-- future Google Calendar feature should read/write it via service role
-- from a dedicated API route (lib/internal/** or the allowlisted
-- app/api/admin/integrations/google/** path), the same pattern already
-- used for other platform-sensitive tables (gdpr_deletion_requests, etc.).

DROP POLICY IF EXISTS tenant_google_integrations_owner_all ON public.tenant_google_integrations;

-- No replacement policy — default deny for anon/authenticated. Service role
-- (which bypasses RLS) remains the only access path.
