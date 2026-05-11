-- Migration 024: Normalize phone numbers to remove duplicates
--
-- Converts Bulgarian mobile numbers to E.164 (+3598XXXXXXXX):
--   0888123456      → +359888123456
--   00359888123456  → +359888123456
--   +359 888 123 456 → +359888123456
--
-- Applied to both `bookings.client_phone` and `clients.phone`.
-- Duplicate client records (same normalized phone, same salon) are merged:
--   the oldest record is kept, newer duplicates are deleted.

-- ─── Helper function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION normalize_bg_phone(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    CASE
      -- Strip formatting first, then rewrite prefix
      WHEN regexp_replace(raw, '[\s\-\(\)\.]', '', 'g') LIKE '00359%'
        THEN '+' || substring(regexp_replace(raw, '[\s\-\(\)\.]', '', 'g') FROM 3)
      WHEN regexp_replace(raw, '[\s\-\(\)\.]', '', 'g') ~ '^08[0-9]{8}$'
        THEN '+359' || substring(regexp_replace(raw, '[\s\-\(\)\.]', '', 'g') FROM 2)
      ELSE regexp_replace(raw, '[\s\-\(\)\.]', '', 'g')
    END
$$;

-- ─── Step 1: Normalize bookings.client_phone ──────────────────────────────────
-- No UNIQUE constraint here, so straight UPDATE is safe.

UPDATE public.bookings
SET client_phone = normalize_bg_phone(client_phone)
WHERE client_phone IS NOT NULL
  AND client_phone NOT IN ('00000', '');

-- ─── Step 2: Merge duplicate clients then normalize clients.phone ─────────────
-- For each (salon_slug, normalized_phone) group with more than one record,
-- keep the oldest (by created_at), redirect all bookings to the canonical phone,
-- and delete the newer duplicate client rows.

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
        normalize_bg_phone(phone) AS norm_phone,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY salon_slug, normalize_bg_phone(phone)
          ORDER BY created_at ASC NULLS LAST
        ) AS rn
      FROM public.clients
      WHERE phone IS NOT NULL
        AND phone NOT IN ('00000', '')
    ),
    to_drop AS (
      SELECT d.id AS drop_id, d.phone AS drop_phone, k.norm_phone, k.salon_slug
      FROM ranked d
      JOIN ranked k
        ON k.salon_slug = d.salon_slug
       AND k.norm_phone = d.norm_phone
       AND k.rn = 1
       AND d.rn > 1
    )
    SELECT * FROM to_drop
  LOOP
    -- Point duplicate bookings at the canonical normalized phone
    UPDATE public.bookings
    SET client_phone = dup.norm_phone
    WHERE salon_slug = dup.salon_slug
      AND client_phone = normalize_bg_phone(dup.drop_phone);

    -- Delete the duplicate client record
    DELETE FROM public.clients WHERE id = dup.drop_id;
  END LOOP;
END $$;

-- ─── Step 3: Normalize remaining clients.phone ────────────────────────────────
-- After deduplication, no conflicts remain, so plain UPDATE is safe.

UPDATE public.clients
SET phone = normalize_bg_phone(phone)
WHERE phone IS NOT NULL
  AND phone NOT IN ('00000', '');

-- ─── Cleanup ──────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS normalize_bg_phone(text);
