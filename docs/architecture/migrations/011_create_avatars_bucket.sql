-- ============================================
-- MIGRATION 011: Create Avatars Storage Bucket
-- SAFE: Creates storage bucket with RLS policies
-- ============================================

-- Create avatars bucket (public readable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy 1: Users can upload own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy 2: Users can update own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy 3: Users can delete own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy 4: Avatar images are publicly readable
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Verification Query (run after migration)
-- SELECT * FROM storage.buckets WHERE id = 'avatars';
