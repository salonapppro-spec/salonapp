-- Migration: 037_email_logs_sent_unique.sql
-- Одит 2026-07-06, находка A1+A3: двойни reminder имейли.
-- Уникален "sent" запис per (booking_id, type) — claim-преди-send в
-- app/api/cron/reminders/route.ts разчита на 23505 при паралелен insert.

-- UP

-- 1) Дедупликация на съществуващи двойни 'sent' записи (пази най-ранния).
DELETE FROM public.email_logs e
WHERE e.status = 'sent'
  AND e.booking_id IS NOT NULL
  AND e.id NOT IN (
    SELECT DISTINCT ON (booking_id, type) id
    FROM public.email_logs
    WHERE status = 'sent' AND booking_id IS NOT NULL
    ORDER BY booking_id, type, sent_at ASC, id ASC
  );

-- 2) Частичен уникален индекс. NULL booking_id (лог без резервация) не се засяга.
CREATE UNIQUE INDEX IF NOT EXISTS email_logs_sent_booking_type_uniq
  ON public.email_logs (booking_id, type)
  WHERE status = 'sent' AND booking_id IS NOT NULL;

-- DOWN
-- DROP INDEX IF EXISTS public.email_logs_sent_booking_type_uniq;
-- (изтритите дублирани редове не се възстановяват)
