/**
 * Delete All Snapshots - Clean Slate
 *
 * ⚠️  WARNING: This deletes ALL historical snapshot data!
 * Use this to start fresh with accurate data.
 *
 * Usage:
 * Run in Supabase SQL Editor
 */

-- ============================================================================
-- Delete All Snapshots
-- ============================================================================

DELETE FROM project_snapshots;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '🗑️  Deleted % snapshot(s)', deleted_count;
  RAISE NOTICE '✅ Database is now clean - ready for fresh snapshots!';
  RAISE NOTICE '📸 Create a new snapshot to start tracking from today';
END $$;
