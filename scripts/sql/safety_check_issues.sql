-- Safety Check: Preview what will be deleted
-- Run this BEFORE cleanup_issues.sql to see what will be removed

-- ============================================
-- 1. Show current state
-- ============================================
SELECT 
  'Total Issues' as metric,
  COUNT(*) as value
FROM public.issues

UNION ALL

SELECT 
  'Unique Titles' as metric,
  COUNT(DISTINCT title) as value
FROM public.issues

UNION ALL

SELECT 
  'Duplicate Entries' as metric,
  COUNT(*) as value
FROM public.issues
WHERE title IN (
  SELECT title 
  FROM public.issues 
  GROUP BY title 
  HAVING COUNT(*) > 1
);

-- ============================================
-- 2. List all duplicate titles with counts
-- ============================================
SELECT 
  title,
  COUNT(*) as duplicate_count,
  MIN(created_at) as oldest_entry,
  MAX(created_at) as newest_entry,
  STRING_AGG(DISTINCT status, ', ') as statuses,
  STRING_AGG(DISTINCT priority, ', ') as priorities
FROM public.issues
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, title;

-- ============================================
-- 3. Preview: Issues that WILL BE KEPT (oldest per title)
-- ============================================
SELECT 
  '🟢 KEEP' as action,
  id,
  title,
  status,
  priority,
  category,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) as row_num
FROM public.issues
WHERE title IN (
  SELECT title 
  FROM public.issues 
  GROUP BY title 
  HAVING COUNT(*) > 1
)
AND ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) = 1
ORDER BY title, created_at;

-- ============================================
-- 4. Preview: Issues that WILL BE DELETED (newer duplicates)
-- ============================================
SELECT 
  '🔴 DELETE' as action,
  id,
  title,
  status,
  priority,
  category,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) as row_num
FROM public.issues
WHERE title IN (
  SELECT title 
  FROM public.issues 
  GROUP BY title 
  HAVING COUNT(*) > 1
)
AND ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) > 1
ORDER BY title, created_at;

-- ============================================
-- 5. Count summary
-- ============================================
SELECT 
  COUNT(*) FILTER (WHERE rn = 1) as issues_to_keep,
  COUNT(*) FILTER (WHERE rn > 1) as issues_to_delete,
  COUNT(*) as total_duplicates
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) as rn
  FROM public.issues
  WHERE title IN (
    SELECT title 
    FROM public.issues 
    GROUP BY title 
    HAVING COUNT(*) > 1
  )
) t;

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Review the output above
-- 2. Check if the "🟢 KEEP" entries are correct
-- 3. Verify "🔴 DELETE" entries can be safely removed
-- 4. If everything looks good, run cleanup_issues.sql
-- 5. If not, contact admin before proceeding
