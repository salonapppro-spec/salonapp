-- Migration: 031_tenant_analytics_seo.sql
-- Adds per-tenant GA4 Measurement ID and Google Search Console verification token
-- UP
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ga4_measurement_id text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gsc_verification_token text;
-- DOWN
-- ALTER TABLE tenants DROP COLUMN IF EXISTS ga4_measurement_id;
-- ALTER TABLE tenants DROP COLUMN IF EXISTS gsc_verification_token;
