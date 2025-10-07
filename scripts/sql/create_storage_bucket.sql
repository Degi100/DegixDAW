-- ============================================
-- CREATE STORAGE BUCKET FOR CHAT ATTACHMENTS
-- Supabase Storage Bucket Setup (Latest Version)
-- ============================================

-- Step 1: Create the storage bucket
-- NOTE: In latest Supabase, buckets are best created via Dashboard or API
-- But this SQL method still works for backwards compatibility

INSERT INTO storage.buckets (
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true, -- Public URLs enabled
  5242880, -- 5 MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/midi',
    'audio/x-midi',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- Step 2: STORAGE POLICIES (Latest Supabase Syntax)
-- ============================================

-- Drop existing policies if they exist (cleanup)
DROP POLICY IF EXISTS "chat_attachments_authenticated_all" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_public_read" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_user_upload" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_user_read" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_user_delete" ON storage.objects;

-- ============================================
-- OPTION A: Simple Development Policy (RECOMMENDED FOR TESTING)
-- ============================================
-- Allow all authenticated users to upload, view, and delete
-- Perfect for development and testing

CREATE POLICY "chat_attachments_authenticated_all"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'chat-attachments')
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow public read access (for sharing via public URLs)
CREATE POLICY "chat_attachments_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');

-- ============================================
-- OPTION B: Production-Ready Policies (COMMENT OUT OPTION A FIRST!)
-- ============================================
-- Only allow users to access files from their own conversations
-- Uncomment these and comment out Option A for production use

/*
-- Users can upload to their conversations
CREATE POLICY "chat_attachments_user_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT conversation_id 
    FROM conversation_members 
    WHERE user_id = auth.uid()
  )
);

-- Users can view files from their conversations
CREATE POLICY "chat_attachments_user_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT conversation_id 
    FROM conversation_members 
    WHERE user_id = auth.uid()
  )
);

-- Users can delete files from their conversations
CREATE POLICY "chat_attachments_user_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT conversation_id 
    FROM conversation_members 
    WHERE user_id = auth.uid()
  )
);
*/

-- ============================================
-- Verification
-- ============================================
-- Check if bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
--
-- Check policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%chat_attachments%';
--
-- Test upload permission (run as authenticated user):
-- SELECT auth.uid(); -- should return your user ID
-- 
-- ============================================
