-- Mark completed issues as DONE
-- Version 0.1.1 Bugfix Release - 3. Oktober 2025

-- ============================================
-- 1. Preview: Issues that will be marked as DONE
-- ============================================
SELECT 
  id,
  title,
  status,
  priority,
  category,
  created_at
FROM public.issues
WHERE title IN (
  '404 bei "Zurück zur Anmeldung"',
  'Add User schlägt fehl',
  'Doppelter Toast bei Login'
)
ORDER BY priority DESC, title;

-- ============================================
-- 2. Update issues to DONE status
-- ============================================
UPDATE public.issues
SET 
  status = 'done',
  updated_at = NOW()
WHERE title IN (
  '404 bei "Zurück zur Anmeldung"',
  'Add User schlägt fehl',
  'Doppelter Toast bei Login'
);

-- ============================================
-- 3. Verify the update
-- ============================================
SELECT 
  '✅ UPDATED' as result,
  id,
  title,
  status,
  priority,
  category,
  updated_at
FROM public.issues
WHERE title IN (
  '404 bei "Zurück zur Anmeldung"',
  'Add User schlägt fehl',
  'Doppelter Toast bei Login'
)
ORDER BY priority DESC, title;

-- ============================================
-- 4. Show updated statistics
-- ============================================
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.issues), 1) as percentage
FROM public.issues
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'open' THEN 1
    WHEN 'in-progress' THEN 2
    WHEN 'done' THEN 3
    WHEN 'closed' THEN 4
  END;

-- ============================================
-- Summary of changes:
-- ============================================
-- Fixed in Version 0.1.1:
-- 1. ✅ 404 bei "Zurück zur Anmeldung" - All /login routes corrected to /
-- 2. ✅ Add User schlägt fehl - Admin API workaround implemented
-- 3. ✅ Doppelter Toast bei Login - Removed duplicate success toast
