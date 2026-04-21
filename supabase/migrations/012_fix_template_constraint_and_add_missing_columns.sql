-- Migration: 012_fix_template_constraint_and_add_missing_columns.sql
-- CRITICAL: DB CHECK for template only allowed bloom/luxe/clean/zen/bold.
-- Saving luxe2 or groom caused a constraint violation → server action threw
-- → "Application error: a server-side exception has occurred".

-- 1. Fix template CHECK constraint — add luxe2, groom
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_template_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_template_check
  CHECK (template = ANY (ARRAY['bloom','luxe','luxe2','clean','zen','bold','groom']));

-- 2. Add missing tenant columns used by settings form and public templates
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS logo_url              TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url        TEXT,
  ADD COLUMN IF NOT EXISTS about_image_url       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
