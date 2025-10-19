-- ============================================
-- Migration 006: Track Comments System (RLS & Indexes)
-- ============================================
-- IMPORTANT: track_comments table already exists from Migration 001!
-- This migration only adds RLS policies and performance indexes.

-- ============================================
-- 1. CREATE INDEXES (Performance)
-- ============================================

-- Query by track (most common)
CREATE INDEX IF NOT EXISTS idx_track_comments_track_id ON public.track_comments(track_id);

-- Query by author (for "my comments")
CREATE INDEX IF NOT EXISTS idx_track_comments_author_id ON public.track_comments(author_id);

-- Query by timestamp (for seeking/playback)
CREATE INDEX IF NOT EXISTS idx_track_comments_timestamp ON public.track_comments(track_id, timestamp_ms);

-- Query unresolved comments
CREATE INDEX IF NOT EXISTS idx_track_comments_unresolved ON public.track_comments(track_id, is_resolved)
  WHERE is_resolved = false;

-- Query by creation date (for recent comments)
CREATE INDEX IF NOT EXISTS idx_track_comments_created_at ON public.track_comments(created_at DESC);

-- ============================================
-- 2. ROW-LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can read comments on accessible tracks" ON public.track_comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tracks" ON public.track_comments;
DROP POLICY IF EXISTS "Users can update own comments or as project owner" ON public.track_comments;
DROP POLICY IF EXISTS "Users can delete own comments or as project owner" ON public.track_comments;

-- Read Policy: Can read comments on tracks you can access
CREATE POLICY "Users can read comments on accessible tracks"
  ON public.track_comments
  FOR SELECT
  USING (
    -- Check if user can access the track via project
    EXISTS (
      SELECT 1 FROM public.tracks t
      JOIN public.projects p ON t.project_id = p.id
      LEFT JOIN public.project_collaborators pc ON p.id = pc.project_id AND pc.user_id = auth.uid()
      WHERE t.id = track_comments.track_id
      AND (
        -- Project is public
        p.is_public = true
        -- Or user is project owner
        OR p.creator_id = auth.uid()
        -- Or user is accepted collaborator with comment permission
        OR (pc.accepted_at IS NOT NULL AND pc.can_comment = true)
      )
    )
  );

-- Create Policy: Can create comments on tracks you can access
CREATE POLICY "Users can create comments on accessible tracks"
  ON public.track_comments
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- author_id must match authenticated user
    AND author_id = auth.uid()
    -- Check if user can comment on the project
    AND EXISTS (
      SELECT 1 FROM public.tracks t
      JOIN public.projects p ON t.project_id = p.id
      LEFT JOIN public.project_collaborators pc ON p.id = pc.project_id AND pc.user_id = auth.uid()
      WHERE t.id = track_comments.track_id
      AND (
        -- User is project owner
        p.creator_id = auth.uid()
        -- Or user is collaborator with comment permission
        OR (pc.accepted_at IS NOT NULL AND pc.can_comment = true)
      )
    )
  );

-- Update Policy: Can update own comments, or if project owner
CREATE POLICY "Users can update own comments or as project owner"
  ON public.track_comments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Own comment
      author_id = auth.uid()
      -- Or project owner
      OR EXISTS (
        SELECT 1 FROM public.tracks t
        JOIN public.projects p ON t.project_id = p.id
        WHERE t.id = track_comments.track_id
        AND p.creator_id = auth.uid()
      )
    )
  );

-- Delete Policy: Can delete own comments, or if project owner
CREATE POLICY "Users can delete own comments or as project owner"
  ON public.track_comments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Own comment
      author_id = auth.uid()
      -- Or project owner
      OR EXISTS (
        SELECT 1 FROM public.tracks t
        JOIN public.projects p ON t.project_id = p.id
        WHERE t.id = track_comments.track_id
        AND p.creator_id = auth.uid()
      )
    )
  );

-- ============================================
-- 3. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE public.track_comments IS 'Timestamp-based comments on audio/MIDI tracks for collaboration';
COMMENT ON COLUMN public.track_comments.timestamp_ms IS 'Position in track (milliseconds) where comment applies';
COMMENT ON COLUMN public.track_comments.content IS 'Comment text';
COMMENT ON COLUMN public.track_comments.is_resolved IS 'Whether the comment has been addressed/resolved';
COMMENT ON COLUMN public.track_comments.author_id IS 'User who created the comment (references auth.users)';

-- ============================================
-- Migration Complete
-- ============================================

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'track_comments'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ Migration 006 Complete: RLS enabled on track_comments';
  ELSE
    RAISE EXCEPTION '❌ Migration 006 Failed: RLS not enabled';
  END IF;
END $$;
