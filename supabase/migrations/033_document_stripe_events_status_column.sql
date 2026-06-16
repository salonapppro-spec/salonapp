-- Migration 033: document stripe_events.status column (audit 2026-06-15/16)
--
-- The "status" column (processing/completed/failed) already exists in
-- production — it was added directly via the Supabase SQL editor at some
-- point without a corresponding migration file in this repo (drift).
-- This migration is a no-op on production (IF NOT EXISTS / idempotent)
-- and exists so a fresh environment provisioned from these migration
-- files ends up with the same schema.
--
-- Code fix: app/api/webhooks/stripe/route.ts previously DELETEd the
-- stripe_events row on a processing error so a Stripe retry could
-- "reclaim" it. That left no audit trail of failures. The handler now
-- uses this status column instead: 'processing' on claim, 'completed'
-- on success, 'failed' on error (row kept, still reclaimable on retry).

ALTER TABLE public.stripe_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_events_status_check'
  ) THEN
    ALTER TABLE public.stripe_events
      ADD CONSTRAINT stripe_events_status_check
      CHECK (status IN ('processing', 'completed', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stripe_events_status
  ON public.stripe_events (status)
  WHERE status = 'failed';
