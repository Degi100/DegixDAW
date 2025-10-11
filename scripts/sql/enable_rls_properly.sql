/**
 * Re-enable RLS with Proper Policies for project_snapshots
 *
 * This script:
 * 1. Re-enables RLS
 * 2. Creates proper policies that work for BOTH:
 *    - GitHub Actions (Service Role Key)
 *    - Admin Dashboard (authenticated admin users)
 */

-- ============================================================================
-- Step 1: Re-enable RLS
-- ============================================================================

ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 2: Drop any existing policies (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can create snapshots" ON project_snapshots;
DROP POLICY IF EXISTS "Admins can read all snapshots" ON project_snapshots;
DROP POLICY IF EXISTS "Admins can delete snapshots" ON project_snapshots;
DROP POLICY IF EXISTS "Service role can create snapshots" ON project_snapshots;
DROP POLICY IF EXISTS "Admins can create snapshots manually" ON project_snapshots;
DROP POLICY IF EXISTS "Allow snapshots creation" ON project_snapshots;

-- ============================================================================
-- Step 3: Create proper policies
-- ============================================================================

-- Policy 1: Admins can read snapshots
CREATE POLICY "Admins can read snapshots"
  ON project_snapshots
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 2: Admins can insert snapshots (from dashboard)
-- Service Role Key bypasses RLS automatically, so this only affects authenticated users
CREATE POLICY "Admins can insert snapshots"
  ON project_snapshots
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Policy 3: Admins can delete snapshots
CREATE POLICY "Admins can delete snapshots"
  ON project_snapshots
  FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS re-enabled with proper policies!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies created:';
  RAISE NOTICE '   1. Admins can read snapshots (SELECT)';
  RAISE NOTICE '   2. Admins can insert snapshots (INSERT)';
  RAISE NOTICE '   3. Admins can delete snapshots (DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 How it works:';
  RAISE NOTICE '   • GitHub Actions: Uses Service Role Key → bypasses RLS automatically ✅';
  RAISE NOTICE '   • Admin Dashboard: Authenticated admin → uses policies above ✅';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test:';
  RAISE NOTICE '   1. Trigger GitHub Actions workflow';
  RAISE NOTICE '   2. Should create snapshot successfully';
  RAISE NOTICE '   3. Check dashboard → should see data';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security: RLS is now active and properly configured!';
END $$;
