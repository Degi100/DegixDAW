/**
 * Diagnose Analytics Setup
 *
 * Checks if all required database objects exist for GitHub Actions snapshots
 *
 * Usage:
 * npm run db:sql diagnose_analytics_setup
 */

-- ============================================================================
-- Check 1: Table project_snapshots exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'project_snapshots'
  ) THEN
    RAISE NOTICE '✅ Table project_snapshots exists';
  ELSE
    RAISE NOTICE '❌ Table project_snapshots MISSING!';
    RAISE NOTICE '   Fix: npm run db:sql analytics_snapshots_table';
  END IF;
END $$;

-- ============================================================================
-- Check 2: Language breakdown columns exist
-- ============================================================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_snapshots') THEN
    -- Check for language columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'project_snapshots' AND column_name = 'typescript_loc') THEN
      missing_columns := array_append(missing_columns, 'typescript_loc');
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'project_snapshots' AND column_name = 'javascript_loc') THEN
      missing_columns := array_append(missing_columns, 'javascript_loc');
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'project_snapshots' AND column_name = 'scss_loc') THEN
      missing_columns := array_append(missing_columns, 'scss_loc');
    END IF;

    IF array_length(missing_columns, 1) > 0 THEN
      RAISE NOTICE '❌ Language columns MISSING: %', array_to_string(missing_columns, ', ');
      RAISE NOTICE '   Fix: npm run db:sql analytics_snapshots_language_breakdown';
    ELSE
      RAISE NOTICE '✅ All language breakdown columns exist';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Check 3: RLS policies exist
-- ============================================================================

DO $$
DECLARE
  policy_count INT;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_snapshots') THEN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'project_snapshots';

    IF policy_count > 0 THEN
      RAISE NOTICE '✅ RLS policies exist (% policies)', policy_count;
    ELSE
      RAISE NOTICE '⚠️  No RLS policies found (might be OK if RLS disabled)';
    END IF;

    -- Show policy details
    RAISE NOTICE '';
    RAISE NOTICE '📋 Current RLS Policies:';
    FOR policy_name IN
      SELECT policyname FROM pg_policies WHERE tablename = 'project_snapshots'
    LOOP
      RAISE NOTICE '   - %', policy_name;
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- Check 4: RPC function pg_database_size exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'pg_database_size'
  ) THEN
    RAISE NOTICE '✅ Function pg_database_size exists (built-in PostgreSQL)';
  ELSE
    RAISE NOTICE '❌ Function pg_database_size MISSING!';
    RAISE NOTICE '   This should be a built-in PostgreSQL function';
  END IF;
END $$;

-- ============================================================================
-- Check 5: Test snapshot creation permissions
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Testing INSERT permission...';

  -- Try to insert a test snapshot
  BEGIN
    INSERT INTO project_snapshots (
      snapshot_date,
      total_loc, total_files, total_commits,
      total_users, active_users,
      total_messages, total_conversations,
      total_issues, open_issues, closed_issues, in_progress_issues,
      database_size_mb, storage_size_mb, total_storage_mb,
      metadata
    ) VALUES (
      '1900-01-01'::DATE,  -- Old date to avoid conflicts
      0, 0, 0,
      0, 0,
      0, 0,
      0, 0, 0, 0,
      0, 0, 0,
      '{"test": true}'::jsonb
    );

    -- Clean up test row
    DELETE FROM project_snapshots WHERE snapshot_date = '1900-01-01'::DATE;

    RAISE NOTICE '✅ INSERT permission test PASSED';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ INSERT permission test FAILED: %', SQLERRM;
    RAISE NOTICE '   This might indicate RLS policy issues';
  END;
END $$;

-- ============================================================================
-- Check 6: Show recent snapshots
-- ============================================================================

DO $$
DECLARE
  snapshot_count INT;
  latest_date DATE;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_snapshots') THEN
    SELECT COUNT(*), MAX(snapshot_date)
    INTO snapshot_count, latest_date
    FROM project_snapshots;

    RAISE NOTICE '';
    RAISE NOTICE '📊 Existing Snapshots:';
    RAISE NOTICE '   Total: %', COALESCE(snapshot_count, 0);
    IF latest_date IS NOT NULL THEN
      RAISE NOTICE '   Latest: %', latest_date;
    ELSE
      RAISE NOTICE '   Latest: No snapshots yet';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '📋 DIAGNOSTICS COMPLETE';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 If issues found, run:';
  RAISE NOTICE '   1. npm run db:sql analytics_snapshots_table';
  RAISE NOTICE '   2. npm run db:sql analytics_snapshots_language_breakdown';
  RAISE NOTICE '   3. npm run db:sql fix_analytics_snapshots_rls';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Then test GitHub Actions:';
  RAISE NOTICE '   https://github.com/Degi100/DegixDAW/actions';
END $$;