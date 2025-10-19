-- ============================================
-- DATABASE STATUS CHECK
-- Run this in Supabase SQL Editor to see what exists
-- ============================================

-- 1. CHECK: Which project-related tables exist?
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%project%'
    OR table_name LIKE '%track%'
    OR table_name LIKE '%preset%'
    OR table_name LIKE '%mixdown%'
    OR table_name LIKE '%collaborator%'
  )
ORDER BY table_name;

-- 2. CHECK: Count rows in existing tables
DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  FOR table_record IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('projects', 'project_collaborators', 'tracks', 'track_comments', 'mixdowns', 'presets')
  LOOP
    EXECUTE 'SELECT COUNT(*) FROM ' || table_record.table_name INTO row_count;
    RAISE NOTICE 'Table: % | Rows: %', table_record.table_name, row_count;
  END LOOP;
END $$;

-- 3. CHECK: RLS Policies on project tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('projects', 'project_collaborators', 'tracks', 'track_comments')
ORDER BY tablename, policyname;

-- 4. CHECK: Indexes on project tables
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'project_collaborators', 'tracks', 'track_comments')
ORDER BY tablename, indexname;

-- ============================================
-- EXPECTED TABLES (from MASTERPLAN):
-- ============================================
-- PHASE 1 (Week 1-2):
-- ✅ projects
-- ✅ project_collaborators
-- ⚠️ project_invites (NEW - not in 001_create_tables.sql!)
--
-- PHASE 1 (Week 3-4):
-- ✅ tracks
-- ⚠️ track_versions (NEW - not in 001_create_tables.sql!)
--
-- PHASE 1 (Week 5-6):
-- ✅ track_comments
--
-- Future:
-- ✅ mixdowns
-- ✅ presets
-- ✅ midi_events
-- ============================================
