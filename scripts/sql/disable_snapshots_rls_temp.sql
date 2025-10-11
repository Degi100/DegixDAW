/**
 * TEMPORARY: Disable RLS for project_snapshots
 *
 * WARNING: This allows ANYONE to access snapshots!
 * Only use for testing GitHub Actions!
 *
 * Re-enable later with: ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;
 */

ALTER TABLE project_snapshots DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '⚠️  RLS DISABLED for project_snapshots!';
  RAISE NOTICE '🔓 Anyone can now access this table!';
  RAISE NOTICE '🧪 Test GitHub Actions now';
  RAISE NOTICE '🔒 Re-enable later: ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;';
END $$;