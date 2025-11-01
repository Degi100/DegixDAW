-- ============================================
-- Show all tables related to users
-- ============================================

-- 1. All tables in public schema (user-related)
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%user%'
    OR table_name LIKE '%profile%'
    OR table_name = 'auth'
  )
ORDER BY table_name;

-- 2. Auth schema tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = 'auth' AND c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 3. Count in each user-related table
SELECT 'auth.users' as table_name, COUNT(*) as row_count FROM auth.users
UNION ALL
SELECT 'public.profiles', COUNT(*) FROM public.profiles
ORDER BY table_name;
