-- Migration: 014_add_background_color_to_tenants.sql
-- Adds background_color column to tenants table.
-- Used by the admin settings form to let salon owners customize
-- the background color of their public site (separate from button/accent color).

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS background_color TEXT;
