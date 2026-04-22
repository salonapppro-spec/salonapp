-- Migration 017: stripe_events idempotency table
--
-- Предотвратява двойна обработка при retry от Stripe.
-- При получаване на webhook — INSERT с stripe_event_id.
-- При дублиран event (23505 unique_violation) — пропускаме обработката.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  stripe_event_id  text        PRIMARY KEY,
  event_type       text        NOT NULL,
  processed_at     timestamptz NOT NULL DEFAULT now()
);

-- Само service role пише/чете
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Без RLS политики = само service role (default deny за всички останали)
