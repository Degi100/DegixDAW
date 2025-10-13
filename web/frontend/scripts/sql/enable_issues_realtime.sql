-- ============================================================================
-- ENABLE REALTIME FOR ISSUES SYSTEM
-- ============================================================================

-- Enable Realtime for issues table
ALTER PUBLICATION supabase_realtime ADD TABLE issues;

-- Enable Realtime for issue_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE issue_comments;

-- Verify
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('issues', 'issue_comments');
