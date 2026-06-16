-- Rename plan values to match pricing page
-- Old: standard(19€) | pro(29€) | premium(49€) | collective(49€)
-- New: starter(15€)  | standard(19€) | pro(29€) | premium(49€)

UPDATE tenants
SET plan = CASE plan
  WHEN 'collective' THEN 'premium'
  WHEN 'premium'    THEN 'pro'
  WHEN 'pro'        THEN 'standard'
  WHEN 'standard'   THEN 'starter'
  ELSE plan
END
WHERE plan IN ('collective', 'premium', 'pro', 'standard');

-- NOTE: original version of this migration referenced the legacy "leads"
-- table, which has no "plan" column (audit 2026-06-15/16). The plan field
-- lives on "platform_leads". Fixed to target the correct table.
UPDATE platform_leads
SET plan = CASE plan
  WHEN 'collective' THEN 'premium'
  WHEN 'premium'    THEN 'pro'
  WHEN 'pro'        THEN 'standard'
  WHEN 'standard'   THEN 'starter'
  ELSE plan
END
WHERE plan IN ('collective', 'premium', 'pro', 'standard');
