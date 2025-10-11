/**
 * Simple RLS Fix - Temporarily disable RLS for testing
 *
 * This is the FASTEST way to test if RLS is the problem.
 * We can re-enable and fix properly later.
 */

-- Disable RLS temporarily
ALTER TABLE project_snapshots DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '⚠️  RLS DISABLED for project_snapshots (temporarily)';
  RAISE NOTICE '🔓 GitHub Actions should now work!';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test now:';
  RAISE NOTICE '   1. Trigger GitHub Actions workflow';
  RAISE NOTICE '   2. Check: node scripts/analytics/check-latest-snapshot.js';
  RAISE NOTICE '   3. Refresh dashboard → should see new data point!';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 To re-enable later:';
  RAISE NOTICE '   ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;';
END $$;
