-- ============================================
-- MIGRATION 005: Storage Bucket RLS Policies
-- Create storage bucket and RLS policies for track uploads
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKET (if not exists)
-- ============================================

-- Note: Buckets cannot be created via SQL in Supabase
-- You must create the bucket manually in Supabase Dashboard:
-- Storage → New Bucket → Name: "project-tracks" → Public: OFF → File size: 5MB

-- ============================================
-- 2. RLS POLICIES FOR STORAGE
-- ============================================

-- NOTE: Using storage.foldername() which returns array like ['projects', 'uuid', 'tracks']
-- Path structure: projects/{project_id}/tracks/{track_id}.mp3
-- So (storage.foldername(name))[2] = project_id

-- Drop existing policies first (idempotent migration)
DROP POLICY IF EXISTS "Users can upload tracks to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their project tracks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their project tracks" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can delete tracks" ON storage.objects;

-- POLICY 1: Allow users to UPLOAD tracks to their own projects
CREATE POLICY "Users can upload tracks to their projects"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-tracks'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.creator_id = auth.uid()
    AND projects.id::text = (storage.foldername(name))[2]
  )
);

-- POLICY 2: Allow users to READ tracks from their projects
CREATE POLICY "Users can read their project tracks"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-tracks'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE (projects.creator_id = auth.uid() OR projects.id IN (
      SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
    ))
    AND projects.id::text = (storage.foldername(name))[2]
  )
);

-- POLICY 3: Allow users to UPDATE tracks in their projects (upsert support)
CREATE POLICY "Users can update their project tracks"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-tracks'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.creator_id = auth.uid()
    AND projects.id::text = (storage.foldername(name))[2]
  )
);

-- POLICY 4: Allow project owners to DELETE tracks
CREATE POLICY "Project owners can delete tracks"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-tracks'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.creator_id = auth.uid()
    AND projects.id::text = (storage.foldername(name))[2]
  )
);

-- ============================================
-- 3. VERIFICATION QUERIES
-- ============================================

-- Check if bucket exists (run in SQL Editor)
-- SELECT * FROM storage.buckets WHERE name = 'project-tracks';

-- Check policies (run in SQL Editor)
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%project%';

-- ============================================
-- MANUAL STEPS REQUIRED:
-- ============================================

-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Settings:
--    - Name: project-tracks
--    - Public: OFF (private bucket)
--    - File size limit: 5242880 (5 MB)
--    - Allowed MIME types: audio/* (optional, leave empty for all)
-- 4. Click "Create Bucket"
-- 5. Run this SQL file in SQL Editor
-- 6. Test upload from frontend

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- DROP POLICY "Users can upload tracks to their projects" ON storage.objects;
-- DROP POLICY "Users can read their project tracks" ON storage.objects;
-- DROP POLICY "Users can update their project tracks" ON storage.objects;
-- DROP POLICY "Project owners can delete tracks" ON storage.objects;

-- Note: You cannot delete the bucket via SQL, use Dashboard → Storage → Delete Bucket
