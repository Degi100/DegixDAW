/**
 * Add Other LOC Column to Project Snapshots
 *
 * Adds other_loc column to track files with extensions not in main categories
 * (e.g., .yml, .yaml, .toml, .txt, .bat, .sh, .html, .xml)
 *
 * Usage:
 * Run in Supabase SQL Editor or via npm script
 */

-- ============================================================================
-- Add Other LOC Column
-- ============================================================================

ALTER TABLE project_snapshots
  ADD COLUMN IF NOT EXISTS other_loc BIGINT DEFAULT 0;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Other LOC column added to project_snapshots!';
  RAISE NOTICE '⚙️  Now tracking .yml, .toml, .bat, .sh, .html, .xml files';
  RAISE NOTICE '📊 Future snapshots will include complete LOC breakdown';
END $$;
