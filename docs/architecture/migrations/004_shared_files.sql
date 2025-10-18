-- ============================================
-- MIGRATION 004: Shared Files System
-- Purpose: Enable file sharing between users (User A → User B)
-- Use-Case: Web Upload → VST Plugin Download
-- ============================================

-- ============================================
-- TABLE: shared_files
-- ============================================
CREATE TABLE IF NOT EXISTS shared_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File Information
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type: 'audio/wav', 'audio/midi', 'image/png', etc.
  storage_path TEXT NOT NULL, -- Supabase Storage path: 'shared_files/{sender_id}/{filename}'

  -- Audio Metadata (optional, auto-detected)
  bpm INTEGER, -- Detected BPM (e.g. 120)
  key TEXT, -- Detected key (e.g. 'C Minor', 'E Major')
  duration_seconds NUMERIC(10, 2), -- Duration in seconds (e.g. 185.50)
  waveform_data JSONB, -- Waveform peaks for preview visualization

  -- Sharing Information
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT, -- Optional message from sender (e.g. "Mehr Hall bitte!")

  -- Status Tracking
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'downloaded', 'imported')),
  read_at TIMESTAMPTZ, -- When recipient opened/viewed the file
  downloaded_at TIMESTAMPTZ, -- When recipient downloaded the file
  imported_at TIMESTAMPTZ, -- When recipient imported file to DAW (via VST)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 524288000) -- Max 500 MB
);

-- ============================================
-- INDEXES
-- ============================================

-- Recipient queries: "Show all files sent to me"
CREATE INDEX IF NOT EXISTS idx_shared_files_recipient
  ON shared_files(recipient_id, status, created_at DESC);

-- Sender queries: "Show all files I sent"
CREATE INDEX IF NOT EXISTS idx_shared_files_sender
  ON shared_files(sender_id, created_at DESC);

-- Status queries: "Show all unread files"
CREATE INDEX IF NOT EXISTS idx_shared_files_status
  ON shared_files(status, created_at DESC);

-- File type queries: "Show all audio files"
CREATE INDEX IF NOT EXISTS idx_shared_files_type
  ON shared_files(file_type, created_at DESC);

-- Combined query: "Show audio files from specific sender to me"
CREATE INDEX IF NOT EXISTS idx_shared_files_recipient_sender_type
  ON shared_files(recipient_id, sender_id, file_type, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can view received files" ON shared_files;
DROP POLICY IF EXISTS "Users can view sent files" ON shared_files;
DROP POLICY IF EXISTS "Users can send files" ON shared_files;
DROP POLICY IF EXISTS "Recipients can update file status" ON shared_files;
DROP POLICY IF EXISTS "Senders can update sent files" ON shared_files;
DROP POLICY IF EXISTS "Users can delete their files" ON shared_files;

-- Policy 1: Users can view files they RECEIVED
CREATE POLICY "Users can view received files"
  ON shared_files
  FOR SELECT
  USING (recipient_id = auth.uid());

-- Policy 2: Users can view files they SENT
CREATE POLICY "Users can view sent files"
  ON shared_files
  FOR SELECT
  USING (sender_id = auth.uid());

-- Policy 3: Users can INSERT files (send to others)
CREATE POLICY "Users can send files"
  ON shared_files
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Policy 4: Recipient can UPDATE status (mark as read/downloaded)
CREATE POLICY "Recipients can update file status"
  ON shared_files
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Policy 5: Sender can UPDATE their own sent files (e.g. delete, update message)
CREATE POLICY "Senders can update sent files"
  ON shared_files
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Policy 6: Users can DELETE files they sent or received
CREATE POLICY "Users can delete their files"
  ON shared_files
  FOR DELETE
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS shared_files_updated_at ON shared_files;
CREATE TRIGGER shared_files_updated_at
  BEFORE UPDATE ON shared_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-set timestamps when status changes
CREATE OR REPLACE FUNCTION update_shared_files_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set read_at when status changes to 'read'
  IF NEW.status = 'read' AND OLD.status = 'unread' AND NEW.read_at IS NULL THEN
    NEW.read_at = NOW();
  END IF;

  -- Set downloaded_at when status changes to 'downloaded'
  IF NEW.status = 'downloaded' AND NEW.downloaded_at IS NULL THEN
    NEW.downloaded_at = NOW();
  END IF;

  -- Set imported_at when status changes to 'imported'
  IF NEW.status = 'imported' AND NEW.imported_at IS NULL THEN
    NEW.imported_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shared_files_status_timestamps ON shared_files;
CREATE TRIGGER shared_files_status_timestamps
  BEFORE UPDATE ON shared_files
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_shared_files_status_timestamps();

-- ============================================
-- STORAGE BUCKET CONFIGURATION
-- ============================================
-- NOTE: Run this in Supabase SQL Editor to create storage bucket

-- Create 'shared_files' bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared_files', 'shared_files', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first (idempotent)
-- NOTE: Policy names MUST be unique per bucket to avoid conflicts!
DROP POLICY IF EXISTS "shared_files: upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "shared_files: view sent files" ON storage.objects;
DROP POLICY IF EXISTS "shared_files: view received files" ON storage.objects;
DROP POLICY IF EXISTS "shared_files: delete own files" ON storage.objects;

-- RLS Policy: Users can upload to their own folder in shared_files bucket
CREATE POLICY "shared_files: upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'shared_files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can view files they sent in shared_files bucket
CREATE POLICY "shared_files: view sent files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'shared_files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can view files sent TO them in shared_files bucket
CREATE POLICY "shared_files: view received files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'shared_files'
    AND EXISTS (
      SELECT 1 FROM shared_files
      WHERE storage_path = name
      AND recipient_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete their own files in shared_files bucket
CREATE POLICY "shared_files: delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'shared_files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get sender statistics for a user
CREATE OR REPLACE FUNCTION get_sender_statistics(p_recipient_id UUID)
RETURNS TABLE (
  sender_id UUID,
  sender_username TEXT,
  sender_avatar TEXT,
  file_count BIGINT,
  unread_count BIGINT,
  total_size BIGINT,
  latest_file_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sf.sender_id,
    p.username,
    p.avatar_url,
    COUNT(*)::BIGINT AS file_count,
    COUNT(*) FILTER (WHERE sf.status = 'unread')::BIGINT AS unread_count,
    SUM(sf.file_size)::BIGINT AS total_size,
    MAX(sf.created_at) AS latest_file_date
  FROM shared_files sf
  INNER JOIN profiles p ON sf.sender_id = p.id
  WHERE sf.recipient_id = p_recipient_id
  GROUP BY sf.sender_id, p.username, p.avatar_url
  ORDER BY latest_file_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark file as read
CREATE OR REPLACE FUNCTION mark_file_as_read(p_file_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE shared_files
  SET
    status = 'read',
    read_at = NOW()
  WHERE
    id = p_file_id
    AND recipient_id = p_user_id
    AND status = 'unread';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show all shared_files columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shared_files';

-- Show all indexes on shared_files
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'shared_files';

-- Show all RLS policies on shared_files
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'shared_files';

-- Test query: Get sender statistics for current user
-- SELECT * FROM get_sender_statistics(auth.uid());

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- DROP FUNCTION IF EXISTS get_sender_statistics(UUID);
-- DROP FUNCTION IF EXISTS mark_file_as_read(UUID, UUID);
-- DROP FUNCTION IF EXISTS update_shared_files_status_timestamps();
-- DROP TABLE IF EXISTS shared_files CASCADE;
-- DELETE FROM storage.buckets WHERE id = 'shared_files';
