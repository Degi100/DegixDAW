-- ============================================
-- USER FILES TABLE - Central File Registry
-- Tracks file ownership for File Browser integration
-- ============================================

-- Create user_files table
CREATE TABLE IF NOT EXISTS user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- File owner
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- Who uploaded it

  -- File Info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Path in Supabase Storage (e.g., "shared_files/{user_id}/{filename}")
  file_type TEXT NOT NULL,  -- MIME type (e.g., "audio/wav", "image/png")
  file_size BIGINT,
  duration_ms INT,  -- For audio/video files

  -- Source Tracking
  source TEXT NOT NULL,  -- 'chat', 'upload', 'project'
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,  -- If from chat
  source_project_ids UUID[],  -- Array of project IDs where file is used

  -- Metadata
  metadata JSONB,  -- Additional metadata (waveform, BPM, etc.)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_uploaded_by ON user_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_user_files_source ON user_files(source);
CREATE INDEX IF NOT EXISTS idx_user_files_message_id ON user_files(source_message_id);
CREATE INDEX IF NOT EXISTS idx_user_files_created_at ON user_files(created_at DESC);

-- GIN index for array searching (source_project_ids)
CREATE INDEX IF NOT EXISTS idx_user_files_project_ids ON user_files USING GIN(source_project_ids);

-- Enable RLS
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own files
CREATE POLICY "Users can view their own files"
  ON user_files
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can view files in projects they collaborate on
CREATE POLICY "Users can view files in collaborated projects"
  ON user_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.user_id = auth.uid()
      AND pc.project_id = ANY(source_project_ids)
    )
  );

-- Users can insert their own files
CREATE POLICY "Users can insert their own files"
  ON user_files
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND uploaded_by = auth.uid());

-- Users can update their own files
CREATE POLICY "Users can update their own files"
  ON user_files
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON user_files
  FOR DELETE
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_files_updated_at ON user_files;
CREATE TRIGGER user_files_updated_at
  BEFORE UPDATE ON user_files
  FOR EACH ROW
  EXECUTE FUNCTION update_user_files_updated_at();

-- Comments
COMMENT ON TABLE user_files IS 'Central file registry for File Browser - tracks ownership and usage across projects';
COMMENT ON COLUMN user_files.user_id IS 'Owner of the file (who has access in File Browser)';
COMMENT ON COLUMN user_files.uploaded_by IS 'User who uploaded the file (usually same as user_id)';
COMMENT ON COLUMN user_files.source IS 'Origin: chat (from message), upload (direct), project (uploaded in project)';
COMMENT ON COLUMN user_files.source_project_ids IS 'Array of project IDs where this file is used (supports multi-project usage)';

-- ============================================
-- EXTEND TRACKS TABLE
-- ============================================

-- Add user_file_id foreign key to tracks
ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS user_file_id UUID REFERENCES user_files(id) ON DELETE CASCADE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tracks_user_file_id ON tracks(user_file_id);

COMMENT ON COLUMN tracks.user_file_id IS 'Link to central file registry (user_files table)';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if table was created
SELECT
  'user_files table created' as status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'user_files';

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_files'
ORDER BY policyname;
