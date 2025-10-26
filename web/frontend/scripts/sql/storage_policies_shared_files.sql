-- ============================================
-- STORAGE POLICIES FOR SHARED_FILES BUCKET
-- Allow project collaborators to read files
-- ============================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can read shared files from their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own shared folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own shared files" ON storage.objects;

-- ============================================
-- READ POLICY: Allow reading files from projects where user is owner or collaborator
-- ============================================

CREATE POLICY "Users can read shared files from their projects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'shared_files'
  AND (
    -- User owns a project that references this file
    EXISTS (
      SELECT 1
      FROM user_files uf
      JOIN tracks t ON t.user_file_id = uf.id
      JOIN projects p ON p.id = t.project_id
      WHERE uf.file_path = name
        AND p.creator_id = auth.uid()
    )
    OR
    -- User is a collaborator on a project that references this file
    EXISTS (
      SELECT 1
      FROM user_files uf
      JOIN tracks t ON t.user_file_id = uf.id
      JOIN project_collaborators pc ON pc.project_id = t.project_id
      WHERE uf.file_path = name
        AND pc.user_id = auth.uid()
        AND pc.accepted_at IS NOT NULL
    )
    OR
    -- User uploaded the file
    EXISTS (
      SELECT 1
      FROM user_files uf
      WHERE uf.file_path = name
        AND uf.uploaded_by = auth.uid()
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
  AND EXISTS (
    SELECT 1
    FROM user_files uf
    WHERE uf.file_path = name
      AND uf.uploaded_by = auth.uid()
  )
);
