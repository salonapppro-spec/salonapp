-- Migration 025: Final deduplication pass + enforce UNIQUE (salon_slug, phone)
--
-- The initial schema defined UNIQUE(salon_slug, phone) but it may not exist
-- in production. This migration:
--   1. Merges any remaining duplicate (salon_slug, phone) client pairs
--      (keeps oldest, deletes newer, re-points bookings)
--   2. Adds the UNIQUE constraint if it does not already exist

-- ─── Step 1: Merge remaining duplicates ──────────────────────────────────────

DO $$
DECLARE
  dup RECORD;
BEGIN
  FOR dup IN
    WITH ranked AS (
      SELECT
        id,
        phone,
        salon_slug,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY salon_slug, phone
          ORDER BY created_at ASC NULLS LAST
        ) AS rn
      FROM public.clients
      WHERE phone IS NOT NULL AND phone != ''
    ),
    to_drop AS (
      SELECT d.id AS drop_id, d.phone, k.salon_slug
      FROM ranked d
      JOIN ranked k
        ON k.salon_slug = d.salon_slug
       AND k.phone = d.phone
       AND k.rn = 1
       AND d.rn > 1
    )
    SELECT * FROM to_drop
  LOOP
    -- Redirect bookings from duplicate client to canonical phone (same value, safety update)
    UPDATE public.bookings
    SET client_phone = dup.phone
    WHERE salon_slug = dup.salon_slug
      AND client_phone = dup.phone
      AND id IN (
        SELECT b.id FROM public.bookings b
        JOIN public.clients c ON c.id = dup.drop_id
          AND b.salon_slug = dup.salon_slug
        LIMIT 1000
      );

    -- Delete the duplicate client
    DELETE FROM public.clients WHERE id = dup.drop_id;
  END LOOP;
END $$;

-- ─── Step 2: Add UNIQUE constraint if missing ─────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.clients'::regclass
      AND contype = 'u'
      AND conname ILIKE '%salon_slug%phone%'
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_salon_slug_phone_unique UNIQUE (salon_slug, phone);
  END IF;
END $$;
