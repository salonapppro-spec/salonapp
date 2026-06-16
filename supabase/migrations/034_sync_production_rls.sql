-- Migration 034: Sync repo migrations with production security state (audit 2026-06-16)
--
-- Production already had these fixes applied manually via SQL Editor.
-- This migration documents them for fresh deploys and keeps Security Advisor clean.
-- Idempotent: safe to run against production (DROP IF EXISTS + CREATE IF NOT EXISTS patterns).

-- ---------------------------------------------------------------------------
-- 1. CRM / super-admin tables — enable RLS + super_admin-only (app_metadata)
--    App access is via service role; policies block direct PostgREST abuse.
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenant_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_call_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_call_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_activity_logs_super_admin_all ON public.tenant_activity_logs;
CREATE POLICY tenant_activity_logs_super_admin_all ON public.tenant_activity_logs
  FOR ALL TO authenticated
  USING  ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

DROP POLICY IF EXISTS tenant_call_tasks_super_admin_all ON public.tenant_call_tasks;
CREATE POLICY tenant_call_tasks_super_admin_all ON public.tenant_call_tasks
  FOR ALL TO authenticated
  USING  ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

DROP POLICY IF EXISTS lead_call_tasks_super_admin_all ON public.lead_call_tasks;
CREATE POLICY lead_call_tasks_super_admin_all ON public.lead_call_tasks
  FOR ALL TO authenticated
  USING  ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- ---------------------------------------------------------------------------
-- 2. Remove anon booking INSERT — production never recreated this after 015/018.
--    All public bookings go through Next.js API (service role + runCreateBooking).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS bookings_public_insert ON public.bookings;

-- ---------------------------------------------------------------------------
-- 3. Remove cross-tenant anon specialist enumeration.
--    Public sites load specialists via server (tenantDb / service role), not anon PostgREST.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS specialists_public_read ON public.specialists;
