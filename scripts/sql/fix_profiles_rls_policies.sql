-- ============================================
-- FIX PROFILES RLS POLICIES
-- ============================================
-- Ermöglicht Users ihre eigenen Profile zu erstellen und zu bearbeiten

-- 1. Zeige aktuelle RLS-Policies
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
WHERE tablename = 'profiles';

-- 2. Entferne alte restriktive Policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- 3. Erstelle neue, funktionierende Policies

-- SELECT: Alle können alle Profile sehen
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (true);

-- INSERT: Authenticated users können Profile erstellen (für ihr eigenes user.id)
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users können nur ihr eigenes Profil updaten
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Users können nur ihr eigenes Profil löschen (optional)
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 4. Stelle sicher dass RLS aktiviert ist
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verifiziere neue Policies
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 6. Test: Zeige ob RLS aktiviert ist
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';
