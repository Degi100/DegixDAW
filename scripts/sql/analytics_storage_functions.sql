-- ============================================================================
-- Analytics Storage Functions - Project Analytics Dashboard
-- ============================================================================
-- Description: RPC Functions for Database & Storage Size Metrics
-- Created: 2025-10-10
-- Version: 1.0.0
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: get_database_size()
-- Description: Returns total database size in bytes
-- Returns: bigint (bytes)
-- Security: DEFINER (runs with elevated privileges)
-- Usage: SELECT get_database_size();
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Grant execute permission to authenticated users
-- (Frontend will check admin role via useAdmin hook)
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;

COMMENT ON FUNCTION get_database_size() IS
'Returns total database size in bytes. Used by Analytics Dashboard to track storage usage.';


-- ----------------------------------------------------------------------------
-- Function: get_table_sizes()
-- Description: Returns size of all tables in public schema
-- Returns: TABLE (tablename text, size_bytes bigint)
-- Security: DEFINER (runs with elevated privileges)
-- Usage: SELECT * FROM get_table_sizes() ORDER BY size_bytes DESC LIMIT 10;
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  tablename text,
  size_bytes bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    t.tablename::text,
    pg_total_relation_size(t.schemaname||'.'||t.tablename) AS size_bytes
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY size_bytes DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;

COMMENT ON FUNCTION get_table_sizes() IS
'Returns size (in bytes) of all tables in public schema, ordered by size descending. Used by Analytics Dashboard for storage breakdown.';


-- ----------------------------------------------------------------------------
-- Verification Queries (Run manually to test)
-- ----------------------------------------------------------------------------

-- Test get_database_size()
-- Expected: Returns total DB size in bytes (e.g., 54857728 = ~52 MB)
-- SELECT get_database_size() AS db_size_bytes,
--        ROUND(get_database_size() / 1024.0 / 1024.0, 2) AS db_size_mb;

-- Test get_table_sizes()
-- Expected: Returns list of tables with sizes
-- SELECT
--   tablename,
--   ROUND(size_bytes / 1024.0 / 1024.0, 2) AS size_mb,
--   ROUND(100.0 * size_bytes / SUM(size_bytes) OVER (), 1) AS percentage
-- FROM get_table_sizes()
-- LIMIT 10;

-- ============================================================================
-- Installation Instructions
-- ============================================================================
-- 1. Copy this entire SQL script
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste script and click "Run"
-- 4. Verify functions exist:
--    SELECT routine_name FROM information_schema.routines
--    WHERE routine_schema = 'public'
--    AND routine_name LIKE 'get_%_size%';
-- ============================================================================
