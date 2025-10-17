-- ============================================
-- DATABASE CLEANUP & ANALYSIS (SUPABASE FIXED)
-- Check what's using space in your database
-- ============================================

-- ============================================
-- 1. TABLE SIZES (Show which tables are big)
-- ============================================
SELECT
  schemaname AS schema,
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS data_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 2. ROW COUNTS (How many rows per table?)
-- ============================================
SELECT
  schemaname,
  relname AS tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================
-- 3. STORAGE USAGE (Files in Storage Buckets)
-- ============================================
SELECT
  bucket_id,
  COUNT(*) AS file_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::BIGINT, 0))) AS total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY SUM(COALESCE((metadata->>'size')::BIGINT, 0)) DESC;

-- ============================================
-- 4. OLD MESSAGES (Check if old chat messages exist)
-- ============================================
SELECT
  COUNT(*) AS total_messages,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days') AS messages_older_30_days,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days') AS messages_older_90_days,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS soft_deleted_messages
FROM messages;

-- ============================================
-- 5. ANALYTICS SNAPSHOTS (Can be cleaned)
-- ============================================
SELECT
  COUNT(*) AS total_snapshots,
  COUNT(*) FILTER (WHERE snapshot_date < NOW() - INTERVAL '90 days') AS snapshots_older_90_days,
  pg_size_pretty(SUM(octet_length(metadata::text))) AS metadata_size
FROM analytics_snapshots;

-- ============================================
-- 6. ISSUES & COMMENTS (Check if many closed issues)
-- ============================================
SELECT
  status,
  COUNT(*) AS issue_count
FROM issues
GROUP BY status
ORDER BY COUNT(*) DESC;

SELECT
  COUNT(*) AS total_comments
FROM issue_comments;

-- ============================================
-- 7. USERS & PROFILES (Check for test users)
-- ============================================
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE email LIKE '%test%' OR email LIKE '%temp%') AS test_users,
  COUNT(*) FILTER (WHERE last_sign_in_at IS NULL) AS never_logged_in,
  COUNT(*) FILTER (WHERE last_sign_in_at < NOW() - INTERVAL '90 days') AS inactive_90_days
FROM auth.users;

-- ============================================
-- 8. CONVERSATIONS (Check for empty/old conversations)
-- ============================================
SELECT
  COUNT(*) AS total_conversations,
  COUNT(*) FILTER (WHERE last_message_at IS NULL) AS conversations_no_messages,
  COUNT(*) FILTER (WHERE last_message_at < NOW() - INTERVAL '90 days') AS conversations_inactive_90_days
FROM conversations;

-- ============================================
-- 9. DATABASE TOTAL SIZE
-- ============================================
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS total_database_size;
