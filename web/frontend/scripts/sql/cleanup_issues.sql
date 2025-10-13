-- Cleanup Issues Table - Remove Duplicates & Fix Data
-- Run this in Supabase SQL Editor

-- 1. Show all issues with their IDs to see duplicates
SELECT id, title, status, priority, category, created_at 
FROM public.issues 
ORDER BY title, created_at;

-- 2. Find duplicate titles
SELECT title, COUNT(*) as count 
FROM public.issues 
GROUP BY title 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. Keep only the FIRST occurrence of each title (delete newer duplicates)
-- This will delete the duplicate entries created by running insert twice
DELETE FROM public.issues
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, title,
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) as rn
    FROM public.issues
  ) t
  WHERE rn > 1
);

-- 4. Verify the cleanup
SELECT COUNT(*) as total_issues FROM public.issues;
SELECT title, status, priority FROM public.issues ORDER BY priority DESC, created_at DESC;
