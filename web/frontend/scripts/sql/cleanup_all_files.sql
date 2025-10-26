-- ============================================
-- CLEANUP ALL FILE-RELATED DATA
-- ⚠️ VORSICHT: Löscht ALLE Files und Tracks!
-- ============================================

-- 1. Lösche alle Tracks (haben user_file_id Foreign Key)
DELETE FROM tracks;

-- 2. Lösche alle user_files
DELETE FROM user_files;

-- 3. Lösche alle message_attachments
DELETE FROM message_attachments;

-- 4. Verify deletion
SELECT
  'tracks' as table_name,
  COUNT(*) as remaining_rows
FROM tracks
UNION ALL
SELECT
  'user_files' as table_name,
  COUNT(*) as remaining_rows
FROM user_files
UNION ALL
SELECT
  'message_attachments' as table_name,
  COUNT(*) as remaining_rows
FROM message_attachments;
