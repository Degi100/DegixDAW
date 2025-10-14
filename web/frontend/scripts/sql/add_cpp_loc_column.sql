/**
 * Add C++ LOC Column to Project Snapshots
 *
 * Adds cpp_loc column to track C++ code from desktop app
 *
 * Usage:
 * Run in Supabase SQL Editor or via npm script
 */

-- ============================================================================
-- Add C++ LOC Column
-- ============================================================================

ALTER TABLE project_snapshots
  ADD COLUMN IF NOT EXISTS cpp_loc BIGINT DEFAULT 0;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ C++ LOC column added to project_snapshots!';
  RAISE NOTICE '⚙️  Now tracking C++ code from desktop app';
  RAISE NOTICE '📊 Future snapshots will include C++ metrics';
END $$;
