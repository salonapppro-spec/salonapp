-- Migration: 030_booking_min_notice_minutes.sql
-- Минимално предизвестие за онлайн резервации (днешния ден), per салон.
-- Преди беше хардкоднато +30 мин в availability/bookings API.
-- UP
ALTER TABLE financial_settings
  ADD COLUMN IF NOT EXISTS booking_min_notice_minutes integer NOT NULL DEFAULT 30;

-- DOWN
-- ALTER TABLE financial_settings DROP COLUMN IF EXISTS booking_min_notice_minutes;
