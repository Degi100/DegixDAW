-- ============================================
-- DATABASE CLEANUP - CORRECT TABLE NAMES
-- ============================================

-- ============================================
-- 1. SHOW ALL YOUR TABLES
-- ============================================
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 2. TABLE SIZES (Top 10)
-- ============================================
SELECT
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 10;

-- ============================================
-- 3. TOTAL DATABASE SIZE
-- ============================================
SELECT pg_size_pretty(pg_database_size(current_database())) AS total_database_size;

-- ============================================
-- 4. MESSAGES TABLE (if exists)
-- ============================================
SELECT
  COUNT(*) AS total_messages,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days') AS older_30_days,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS soft_deleted
FROM messages;

-- ============================================
-- 5. PROJECT_SNAPSHOTS TABLE (Daily Analytics)
-- ============================================
SELECT
  COUNT(*) AS total_snapshots,
  COUNT(*) FILTER (WHERE snapshot_date < NOW() - INTERVAL '90 days') AS older_90_days,
  MIN(snapshot_date) AS oldest_snapshot,
  MAX(snapshot_date) AS newest_snapshot,
  pg_size_pretty(pg_total_relation_size('public.project_snapshots')) AS table_size
FROM project_snapshots;

-- ============================================
-- 6. ISSUES & COMMENTS
-- ============================================
SELECT
  status,
  COUNT(*) AS count
FROM issues
GROUP BY status
ORDER BY COUNT(*) DESC;

SELECT
  COUNT(*) AS total_comments,
  pg_size_pretty(pg_total_relation_size('public.issue_comments')) AS table_size
FROM issue_comments;

-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================
SELECT
  bucket_id,
  COUNT(*) AS file_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::BIGINT, 0))) AS total_size
FROM storage.objects
GROUP BY bucket_id;

-- ============================================
-- 8. USERS
-- ============================================
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE last_sign_in_at IS NULL) AS never_logged_in,
  COUNT(*) FILTER (WHERE last_sign_in_at < NOW() - INTERVAL '90 days') AS inactive_90_days
FROM auth.users;

-- ============================================
-- 9. CONVERSATIONS
-- ============================================
SELECT
  COUNT(*) AS total_conversations,
  COUNT(*) FILTER (WHERE last_message_at IS NULL) AS no_messages,
  COUNT(*) FILTER (WHERE last_message_at < NOW() - INTERVAL '90 days') AS inactive_90_days
FROM conversations;
