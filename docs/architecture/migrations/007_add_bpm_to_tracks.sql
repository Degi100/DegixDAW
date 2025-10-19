-- ============================================
-- Migration 007: Add BPM Column to Tracks Table
-- ============================================
-- IMPORTANT: This migration adds BPM (Beats Per Minute) detection support
-- to existing tracks table for tempo analysis.

-- ============================================
-- 1. ADD BPM COLUMN
-- ============================================

-- Add BPM column to tracks table (nullable, as existing tracks won't have it)
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS bpm INTEGER;

-- Add constraint for valid BPM range (20-300 BPM is standard for music)
ALTER TABLE public.tracks ADD CONSTRAINT tracks_bpm_range CHECK (bpm IS NULL OR (bpm BETWEEN 20 AND 300));

-- ============================================
-- 2. ADD COLUMN COMMENT (Documentation)
-- ============================================

COMMENT ON COLUMN public.tracks.bpm IS 'Detected beats per minute (tempo) using web-audio-beat-detector';

-- ============================================
-- 3. CREATE INDEX (Performance)
-- ============================================

-- Index for filtering/sorting tracks by BPM
CREATE INDEX IF NOT EXISTS idx_tracks_bpm ON public.tracks(bpm) WHERE bpm IS NOT NULL;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tracks'
    AND column_name = 'bpm'
  ) THEN
    RAISE NOTICE '✅ Migration 007 Complete: BPM column added to tracks table';
  ELSE
    RAISE EXCEPTION '❌ Migration 007 Failed: BPM column not added';
  END IF;
END $$;
