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

UPDATE leads
SET plan = CASE plan
  WHEN 'collective' THEN 'premium'
  WHEN 'premium'    THEN 'pro'
  WHEN 'pro'        THEN 'standard'
  WHEN 'standard'   THEN 'starter'
  ELSE plan
END
WHERE plan IN ('collective', 'premium', 'pro', 'standard');
