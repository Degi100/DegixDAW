-- ============================================
-- Migration 015: Enable Realtime for project_collaborators
-- ============================================
-- Created: 2025-10-29
-- Description: Enable Supabase Realtime for project_collaborators table

-- Check if table is already in publication
DO $$
BEGIN
  -- Only add to publication if not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'project_collaborators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_collaborators;
    RAISE NOTICE 'Added project_collaborators to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'project_collaborators already in supabase_realtime publication - skipping';
  END IF;
END $$;

-- Set REPLICA IDENTITY to FULL (so we get old and new values in realtime events)
-- This is safe to run multiple times
ALTER TABLE project_collaborators REPLICA IDENTITY FULL;

-- Verify
-- Run this to check if realtime is enabled:
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_collaborators';
