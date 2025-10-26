-- ============================================
-- ENABLE REALTIME FOR FILE TABLES
-- Add user_files and tracks to realtime publication
-- ============================================

-- Add user_files table to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_files;

-- Add tracks table to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;

-- Verify they were added
SELECT
  schemaname,
  tablename
FROM
  pg_publication_tables
WHERE
  pubname = 'supabase_realtime'
  AND tablename IN ('user_files', 'tracks')
ORDER BY
  tablename;
