/**
 * Project Snapshots Table - Historical Analytics Data
 *
 * Stores daily snapshots of project metrics for historical timeline
 * Used by GrowthChart to show real historical data
 *
 * Usage:
 * npm run db:sql analytics_snapshots_table
 */

-- ============================================================================
-- Table: project_snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,

  -- Code Metrics
  total_loc BIGINT NOT NULL,
  total_files INT NOT NULL,
  total_commits INT NOT NULL,

  -- User Metrics
  total_users INT NOT NULL,
  active_users INT NOT NULL,

  -- Chat Metrics
  total_messages BIGINT NOT NULL,
  total_conversations INT NOT NULL,

  -- Issue Metrics
  total_issues INT NOT NULL,
  open_issues INT NOT NULL,
  closed_issues INT NOT NULL,
  in_progress_issues INT NOT NULL,

  -- Storage Metrics
  database_size_mb NUMERIC(10,2) NOT NULL,
  storage_size_mb NUMERIC(10,2) NOT NULL,
  total_storage_mb NUMERIC(10,2) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_project_snapshots_date
  ON project_snapshots(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_created_at
  ON project_snapshots(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can read all snapshots
CREATE POLICY "Admins can read all snapshots"
  ON project_snapshots
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 2: Admins can create snapshots
CREATE POLICY "Admins can create snapshots"
  ON project_snapshots
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 3: Admins can delete old snapshots
CREATE POLICY "Admins can delete snapshots"
  ON project_snapshots
  FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT ALL ON project_snapshots TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ project_snapshots table created successfully!';
  RAISE NOTICE '📊 Historical analytics data ready for GrowthChart';
  RAISE NOTICE '🔒 RLS enabled: Only admins can CRUD snapshots';
END $$;
