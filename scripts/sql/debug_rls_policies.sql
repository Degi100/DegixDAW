-- Debug RLS Policies für Issues Table
-- Führe das aus während du eingeloggt bist, um zu sehen was die Policies sehen

-- 1. Was sieht auth.jwt()?
SELECT 
  auth.jwt() as full_jwt,
  auth.jwt() -> 'user_metadata' as user_metadata_object,
  auth.jwt() -> 'user_metadata' ->> 'is_admin' as is_admin_string,
  (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean as is_admin_boolean,
  auth.jwt() ->> 'email' as email_from_jwt;

-- 2. Welche Policies sind auf der Issues-Tabelle?
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
WHERE tablename = 'issues';

-- 3. Test: Kann ich Issues sehen?
SELECT COUNT(*) as issue_count FROM public.issues;

-- 4. Bypass RLS temporär (nur für Debug)
-- ACHTUNG: Nur zum Testen! Danach wieder aktivieren!
ALTER TABLE public.issues DISABLE ROW LEVEL SECURITY;

-- Nach dem Test wieder aktivieren:
-- ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
