-- ============================================
-- CHECK REALTIME PUBLICATION
-- Verify which tables have realtime enabled
-- ============================================

-- Check if tracks table is in realtime publication
SELECT
  schemaname,
  tablename
FROM
  pg_publication_tables
WHERE
  pubname = 'supabase_realtime'
ORDER BY
  schemaname,
  tablename;

-- Expected output should include:
-- public | user_files
-- public | tracks
-- public | message_attachments (maybe)
