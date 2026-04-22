-- Add status tracking to stripe_events to avoid delete-on-failure race condition.
-- 'processing' → event claimed but not yet done (short-lived)
-- 'completed'  → successfully processed
-- 'failed'     → processing failed; eligible for retry

ALTER TABLE public.stripe_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('processing', 'completed', 'failed'));
