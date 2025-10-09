-- ============================================================================
-- CHECK ISSUES RLS POLICIES
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('issues', 'issue_comments')
ORDER BY tablename, policyname;
