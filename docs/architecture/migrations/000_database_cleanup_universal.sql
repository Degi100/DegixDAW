-- ============================================
-- DATABASE CLEANUP - UNIVERSAL (Works for ANY Supabase DB)
-- Only checks tables that exist
-- ============================================

-- ============================================
-- 1. SHOW ALL TABLES YOU HAVE
-- ============================================
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 2. TABLE SIZES (Top 10 biggest tables)
-- ============================================
SELECT
  schemaname AS schema,
  tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ============================================
-- 3. TOTAL DATABASE SIZE
-- ============================================
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS total_database_size;

-- ============================================
-- 4. ROW COUNTS (Top 10 tables with most rows)
-- ============================================
SELECT
  schemaname,
  relname AS tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 10;

-- ============================================
-- 5. STORAGE BUCKETS (if any)
-- ============================================
SELECT
  bucket_id,
  COUNT(*) AS file_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::BIGINT, 0))) AS total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY SUM(COALESCE((metadata->>'size')::BIGINT, 0)) DESC;

-- ============================================
-- 6. USERS COUNT
-- ============================================
SELECT COUNT(*) AS total_users FROM auth.users;

-- ============================================
-- NEXT STEPS:
-- After seeing the results, we can check specific tables:
-- - If you have 'messages': Check for old/deleted messages
-- - If you have 'issues': Check for closed issues
-- - If you have storage files: Check for old files
-- ============================================
