-- ============================================
-- Migration 015: Enable Realtime for project_collaborators
-- ============================================
-- Created: 2025-10-29
-- Description: Enable Supabase Realtime for project_collaborators table

-- Enable Realtime (Supabase automatically creates publication)
-- This allows clients to subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE project_collaborators;

-- Set REPLICA IDENTITY to FULL (so we get old and new values in realtime events)
ALTER TABLE project_collaborators REPLICA IDENTITY FULL;

-- Verify
-- Run this to check if realtime is enabled:
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_collaborators';
