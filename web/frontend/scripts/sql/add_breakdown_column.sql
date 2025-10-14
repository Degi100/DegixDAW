/**
 * Add Breakdown Column to Project Snapshots
 *
 * Adds breakdown JSONB column to store detailed LOC breakdowns for tooltips
 *
 * Usage:
 * Run in Supabase SQL Editor
 */

-- ============================================================================
-- Add Breakdown Column
-- ============================================================================

ALTER TABLE project_snapshots
  ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Breakdown column added to project_snapshots!';
  RAISE NOTICE '📊 Now storing detailed LOC breakdowns for tooltips';
  RAISE NOTICE '   - TypeScript: frontend/backend/packages breakdown';
  RAISE NOTICE '   - JSON: package-lock vs configs vs other';
  RAISE NOTICE '   - Other: yml/toml/bat/sh/html breakdown';
END $$;
