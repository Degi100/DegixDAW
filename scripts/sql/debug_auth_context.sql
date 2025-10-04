-- ============================================
-- DEBUG: Check Auth Context
-- ============================================
-- Teste ob auth.uid() funktioniert

-- Test 1: Zeige current auth.uid()
SELECT auth.uid() as current_user_id;

-- Test 2: Zeige alle conversations Policies
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
WHERE tablename = 'conversations';

-- Test 3: Teste INSERT mit explizitem User
-- ERSETZE 'DEINE-USER-ID' mit deiner tatsächlichen User-ID!
-- Finde deine ID: SELECT id FROM auth.users WHERE email = 'deine@email.com';
