-- ============================================
-- STORAGE POLICIES FOR SHARED_FILES BUCKET (V2)
-- Simplified version for debugging
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read shared files from their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own shared folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own shared files" ON storage.objects;

-- ============================================
-- READ POLICY: Simple version - allow if user is in any project with this file
-- ============================================

CREATE POLICY "Users can read shared files from their projects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'shared_files'
  AND (
    -- User uploaded the file themselves
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- User is owner of a project that uses this file
    EXISTS (
      SELECT 1
      FROM tracks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.file_path = name
        AND p.creator_id = auth.uid()
    )
    OR
    -- User is collaborator on a project that uses this file
    EXISTS (
      SELECT 1
      FROM tracks t
      JOIN project_collaborators pc ON pc.project_id = t.project_id
      WHERE t.file_path = name
        AND pc.user_id = auth.uid()
        AND pc.accepted_at IS NOT NULL
    )
  )
);

-- ============================================
-- INSERT POLICY: Allow users to upload to their own folder
-- ============================================

CREATE POLICY "Users can upload to their own shared folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shared_files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- DELETE POLICY: Allow users to delete their own files
-- ============================================

CREATE POLICY "Users can delete their own shared files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'shared_files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
