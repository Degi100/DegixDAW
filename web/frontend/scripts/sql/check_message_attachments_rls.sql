-- ============================================
-- CHECK MESSAGE_ATTACHMENTS RLS POLICIES
-- View all policies for message_attachments table
-- ============================================

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
WHERE tablename = 'message_attachments'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'message_attachments';
