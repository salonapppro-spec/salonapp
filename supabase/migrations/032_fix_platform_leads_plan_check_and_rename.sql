-- Corrective migration (audit 2026-06-15/16): 026_rename_plan_values.sql
-- incorrectly targeted the legacy "leads" table (no "plan" column) instead
-- of "platform_leads". Separately, platform_leads_plan_check was never
-- updated to allow "starter" when tenants_plan_check was — applying it
-- caused a 23514 check-constraint violation in production.
--
-- Applied directly to production via Supabase MCP on 2026-06-16; this file
-- documents the change and makes it replayable on a fresh environment.

-- 1. Align plan CHECK constraint with current pricing model (starter/standard/pro/premium)
ALTER TABLE platform_leads DROP CONSTRAINT IF EXISTS platform_leads_plan_check;
ALTER TABLE platform_leads ADD CONSTRAINT platform_leads_plan_check
  CHECK (plan = ANY (ARRAY['starter'::text, 'standard'::text, 'pro'::text, 'premium'::text]));

-- 2. Re-apply the rename to the correct table (idempotent: only matches old values)
UPDATE platform_leads
SET plan = CASE plan
  WHEN 'collective' THEN 'premium'
  WHEN 'premium'    THEN 'pro'
  WHEN 'pro'        THEN 'standard'
  WHEN 'standard'   THEN 'starter'
  ELSE plan
END
WHERE plan IN ('collective', 'premium', 'pro', 'standard');
