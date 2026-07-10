-- Migration: 042_email_logs_review_request_type.sql
-- Разрешава type='review_request' в email_logs — post-visit имейл за отзив
-- (пилот за ats-massage). Dedupe идва наготово от частичния уникален индекс
-- email_logs_sent_booking_type_uniq (booking_id, type) WHERE status='sent'.

-- UP
ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_type_check;
ALTER TABLE email_logs
  ADD CONSTRAINT email_logs_type_check
  CHECK (type = ANY (ARRAY['confirmation'::text, 'reminder'::text, 'sms'::text, 'review_request'::text]));

-- DOWN
-- ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_type_check;
-- ALTER TABLE email_logs
--   ADD CONSTRAINT email_logs_type_check
--   CHECK (type = ANY (ARRAY['confirmation'::text, 'reminder'::text, 'sms'::text]));
