/**
 * Project Milestones Table - Custom Admin Milestones
 *
 * Allows admins to manually add project milestones via UI
 * These will be merged with hardcoded milestones from milestones.ts
 *
 * Usage:
 * npm run db:sql analytics_milestones_table
 */

-- ============================================================================
-- Table: project_milestones
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Milestone Details
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎯',
  category TEXT NOT NULL CHECK (category IN ('feature', 'release', 'code', 'users', 'milestone')),
  milestone_date DATE NOT NULL,

  -- Git Integration (optional)
  commit_hash TEXT,

  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_project_milestones_date
  ON project_milestones(milestone_date DESC);

CREATE INDEX IF NOT EXISTS idx_project_milestones_created_by
  ON project_milestones(created_by);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can read all milestones
CREATE POLICY "Admins can read all milestones"
  ON project_milestones
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 2: Admins can create milestones
CREATE POLICY "Admins can create milestones"
  ON project_milestones
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 3: Admins can update own milestones
CREATE POLICY "Admins can update own milestones"
  ON project_milestones
  FOR UPDATE
  USING (
    created_by = auth.uid() AND
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 4: Admins can delete own milestones
CREATE POLICY "Admins can delete own milestones"
  ON project_milestones
  FOR DELETE
  USING (
    created_by = auth.uid() AND
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_project_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_project_milestones_updated_at();

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT ALL ON project_milestones TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ project_milestones table created successfully!';
  RAISE NOTICE '📋 Admins can now add custom milestones via UI';
  RAISE NOTICE '🔒 RLS enabled: Only admins can CRUD, only own milestones can be updated/deleted';
END $$;
