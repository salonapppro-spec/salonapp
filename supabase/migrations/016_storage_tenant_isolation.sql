-- Migration 016: Storage gallery policies — tenant path isolation
--
-- ПРИЧИНА: Старите policies проверяват само bucket_id = 'gallery'.
-- Всеки логнат потребител може да upload/update/delete файлове на всеки салон.
-- Новите policies изискват файлът да е в папка salon_slug/ на собственика.
-- Зависи от migration 015 (app_metadata вместо user_metadata).
--
-- Очаквана структура на пътищата: gallery/<salon_slug>/<filename>

-- ---------------------------------------------------------------------------
-- Премахни старите широки политики
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload gallery images"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update gallery images"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete gallery images"   ON storage.objects;

-- ---------------------------------------------------------------------------
-- Нови политики с tenant path ownership
-- ---------------------------------------------------------------------------

-- INSERT: само в собствената папка
CREATE POLICY "Owners can upload to own gallery folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'salon_slug')
  );

-- UPDATE: само собствените файлове
CREATE POLICY "Owners can update own gallery files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'salon_slug')
  );

-- DELETE: само собствените файлове
CREATE POLICY "Owners can delete own gallery files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'salon_slug')
  );

-- SELECT: публично четене остава непроменено (bucket е public)
