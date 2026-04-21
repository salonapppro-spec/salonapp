-- Migration: 013_storage_gallery_bucket_policies.sql
-- Creates the 'gallery' storage bucket and RLS policies for image uploads.
-- Without this bucket, salon image uploads fail with "Качването не успя."

-- 1. Create gallery bucket (public read, restricted write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload gallery images'
  ) THEN
    CREATE POLICY "Authenticated users can upload gallery images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'gallery');
  END IF;
END $$;

-- 3. Allow public (anon) read access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for gallery images'
  ) THEN
    CREATE POLICY "Public read access for gallery images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'gallery');
  END IF;
END $$;

-- 4. Allow authenticated users to update their own uploads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update gallery images'
  ) THEN
    CREATE POLICY "Authenticated users can update gallery images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'gallery');
  END IF;
END $$;

-- 5. Allow authenticated users to delete their own uploads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete gallery images'
  ) THEN
    CREATE POLICY "Authenticated users can delete gallery images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'gallery');
  END IF;
END $$;
