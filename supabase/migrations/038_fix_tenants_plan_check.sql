-- Corrective migration (одит 2026-07-06, C1): tenants_plan_check беше
-- поправен само директно в production, без миграция в repo-то — на чиста
-- среда insert с plan='starter' гърми (23514 check violation), а legacy
-- 'collective' остава разрешен. Този файл документира промяната и я прави
-- replayable. Идемпотентно спрямо production (constraint-ът там вече е такъв).

-- 1. Защита при replay: 'collective' е единствената стойност, позволена от
--    стария CHECK, но отхвърляна от новия (026 вече е преименувал останалите).
--    НЕ прилагаме пълния rename повторно — би преименувал валидни текущи
--    стойности втори път.
UPDATE tenants SET plan = 'premium' WHERE plan = 'collective';

-- 2. Plan CHECK по текущия ценови модел (starter/standard/pro/premium)
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_check
  CHECK (plan = ANY (ARRAY['starter'::text, 'standard'::text, 'pro'::text, 'premium'::text]));
