/**
 * Add Language Breakdown to Project Snapshots
 *
 * Tracks LOC per language for detailed analytics
 *
 * Usage:
 * npm run db:sql analytics_snapshots_language_breakdown
 */

-- ============================================================================
-- Add Language Breakdown Columns
-- ============================================================================

ALTER TABLE project_snapshots
  ADD COLUMN IF NOT EXISTS typescript_loc BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS javascript_loc BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scss_loc BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS css_loc BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sql_loc BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS json_loc BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markdown_loc BIGINT DEFAULT 0;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Language breakdown columns added to project_snapshots!';
  RAISE NOTICE '📊 Now tracking: TypeScript, JavaScript, SCSS, CSS, SQL, JSON, Markdown';
  RAISE NOTICE '🔥 Re-run backfill script to populate language stats';
END $$;
