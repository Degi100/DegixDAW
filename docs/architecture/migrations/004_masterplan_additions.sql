-- ============================================
-- MIGRATION 004: MASTERPLAN Additions
-- Adds missing tables/columns for Phase 1
-- ============================================

-- ============================================
-- 1. ALTER project_collaborators
-- Add invite_method column
-- ============================================

ALTER TABLE project_collaborators
ADD COLUMN IF NOT EXISTS invite_method TEXT
CHECK (invite_method IN ('username', 'link', 'chat'));

COMMENT ON COLUMN project_collaborators.invite_method IS 'How was this collaborator invited? username, link, or chat';

-- ============================================
-- 2. CREATE project_invites Table
-- For invite link functionality
-- ============================================

CREATE TABLE IF NOT EXISTS project_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER, -- NULL = unlimited
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE project_invites IS 'Shareable invite links for projects';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_invites_code
  ON project_invites(invite_code);

CREATE INDEX IF NOT EXISTS idx_project_invites_project
  ON project_invites(project_id, created_at DESC);

-- ============================================
-- 3. CREATE track_versions Table
-- For GitHub-style versioning
-- ============================================

CREATE TABLE IF NOT EXISTS track_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  commit_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  UNIQUE(track_id, version_number)
);

COMMENT ON TABLE track_versions IS 'Version history for tracks (like Git commits)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_track_versions_track
  ON track_versions(track_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_track_versions_current
  ON track_versions(track_id)
  WHERE is_current = true;

-- ============================================
-- 4. RLS POLICIES for project_invites
-- ============================================

ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invites for projects they own or collaborate on
CREATE POLICY "Users can view project invites"
  ON project_invites
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE creator_id = auth.uid()
      UNION
      SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
    )
  );

-- Policy: Project owners can create invites
CREATE POLICY "Project owners can create invites"
  ON project_invites
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE creator_id = auth.uid()
    )
  );

-- Policy: Collaborators with invite permission can create invites
CREATE POLICY "Collaborators can create invites if permitted"
  ON project_invites
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid()
      AND can_invite_others = true
    )
  );

-- Policy: Invite creators can delete their own invites
CREATE POLICY "Users can delete own invites"
  ON project_invites
  FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- 5. RLS POLICIES for track_versions
-- ============================================

ALTER TABLE track_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of tracks in accessible projects
CREATE POLICY "Users can view track versions"
  ON track_versions
  FOR SELECT
  USING (
    track_id IN (
      SELECT t.id FROM tracks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE p.creator_id = auth.uid()
      OR p.id IN (
        SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Contributors can create versions
CREATE POLICY "Contributors can create track versions"
  ON track_versions
  FOR INSERT
  WITH CHECK (
    track_id IN (
      SELECT t.id FROM tracks t
      INNER JOIN project_collaborators pc ON t.project_id = pc.project_id
      WHERE pc.user_id = auth.uid()
      AND pc.can_upload_audio = true
    )
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function: Generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if invite code is valid and can be used
CREATE OR REPLACE FUNCTION is_invite_valid(code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
BEGIN
  SELECT * INTO invite_record
  FROM project_invites
  WHERE invite_code = code;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check expiry
  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Check usage limit
  IF invite_record.max_uses IS NOT NULL AND invite_record.used_count >= invite_record.max_uses THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Use invite code (increments used_count)
CREATE OR REPLACE FUNCTION use_invite_code(code TEXT, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  invite_record RECORD;
  project_uuid UUID;
BEGIN
  -- Get invite
  SELECT * INTO invite_record
  FROM project_invites
  WHERE invite_code = code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite code not found';
  END IF;

  -- Validate
  IF NOT is_invite_valid(code) THEN
    RAISE EXCEPTION 'Invite code is expired or exhausted';
  END IF;

  project_uuid := invite_record.project_id;

  -- Check if user is already collaborator
  IF EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_id = project_uuid
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is already a collaborator';
  END IF;

  -- Add user as collaborator
  INSERT INTO project_collaborators (
    project_id,
    user_id,
    role,
    can_upload_audio,
    can_comment,
    invited_by,
    invite_method,
    accepted_at
  ) VALUES (
    project_uuid,
    p_user_id,
    'contributor',
    true,
    true,
    invite_record.created_by,
    'link',
    NOW()
  );

  -- Increment used_count
  UPDATE project_invites
  SET used_count = used_count + 1
  WHERE invite_code = code;

  RETURN project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Auto-update updated_at for track_versions (reuse existing function)
-- (Assuming update_updated_at() function exists from previous migrations)

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if project_invites table exists
-- SELECT COUNT(*) FROM project_invites;

-- Check if track_versions table exists
-- SELECT COUNT(*) FROM track_versions;

-- Check if invite_method column was added
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'project_collaborators' AND column_name = 'invite_method';

-- Test invite code generation
-- SELECT generate_invite_code(8);

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- DROP FUNCTION IF EXISTS use_invite_code(TEXT, UUID);
-- DROP FUNCTION IF EXISTS is_invite_valid(TEXT);
-- DROP FUNCTION IF EXISTS generate_invite_code(INTEGER);
-- DROP TABLE IF EXISTS track_versions CASCADE;
-- DROP TABLE IF EXISTS project_invites CASCADE;
-- ALTER TABLE project_collaborators DROP COLUMN IF EXISTS invite_method;
