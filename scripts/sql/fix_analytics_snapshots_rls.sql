/**
 * Fix Analytics Snapshots RLS for GitHub Actions
 *
 * Problem: GitHub Actions hat keinen User-Context (kein JWT)
 * Solution: Service Role Key sollte RLS bypassen können
 *
 * Usage:
 * npm run db:sql fix_analytics_snapshots_rls
 */

-- ============================================================================
-- Drop old restrictive policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can create snapshots" ON project_snapshots;
DROP POLICY IF EXISTS "Admins can read all snapshots" ON project_snapshots;
DROP POLICY IF EXISTS "Admins can delete snapshots" ON project_snapshots;

-- ============================================================================
-- Create new policies that allow Service Role Key
-- ============================================================================

-- Policy 1: Admins can read all snapshots (authenticated users only)
CREATE POLICY "Admins can read all snapshots"
  ON project_snapshots
  FOR SELECT
  USING (
    -- Allow if user is admin
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 2: Service Role can create snapshots (for GitHub Actions)
-- Service Role Key bypasses RLS automatically, but we add this for clarity
CREATE POLICY "Service role can create snapshots"
  ON project_snapshots
  FOR INSERT
  WITH CHECK (true);  -- Service Role Key bypasses RLS anyway

-- Policy 3: Admins can create snapshots manually (from dashboard)
CREATE POLICY "Admins can create snapshots manually"
  ON project_snapshots
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 4: Admins can delete old snapshots
CREATE POLICY "Admins can delete snapshots"
  ON project_snapshots
  FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- Alternative: Disable RLS for project_snapshots (NUCLEAR OPTION)
-- ============================================================================
-- Uncomment if above policies still cause issues:
-- ALTER TABLE project_snapshots DISABLE ROW LEVEL SECURITY;
-- WICHTIG: Dies erlaubt JEDEM Client-Zugriff! Nur für Testing!

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated for project_snapshots!';
  RAISE NOTICE '🔓 Service Role Key can now create snapshots (GitHub Actions)';
  RAISE NOTICE '🔒 Admins can still read/create/delete via dashboard';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test GitHub Actions:';
  RAISE NOTICE '   1. Go to https://github.com/Degi100/DegixDAW/actions';
  RAISE NOTICE '   2. Click "Daily Analytics Snapshot"';
  RAISE NOTICE '   3. Click "Run workflow"';
  RAISE NOTICE '   4. Check logs for success message';
END $$;