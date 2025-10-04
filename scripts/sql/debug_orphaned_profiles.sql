-- ============================================
-- DEBUG: Welche Profile haben KEINE Auth-User?
-- ============================================

-- 1. Profile OHNE Auth-User (das ist das Problem!)
SELECT 
  'PROBLEM: Profile ohne Auth-User' as issue,
  p.id as profile_id,
  p.username,
  p.full_name
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 2. Auth-User OHNE Profile
SELECT 
  'Auth-User ohne Profile' as issue,
  u.id as user_id,
  u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Korrekt gematchte Profile <-> Auth-Users
SELECT 
  'OK: Korrekt gematched' as status,
  p.id,
  p.username,
  u.email
FROM public.profiles p
INNER JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- LÖSUNG: Lösche Profile die KEINE Auth-User haben
-- ============================================
-- ACHTUNG: Nur ausführen wenn du sicher bist!
/*
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);
*/

-- ============================================
-- Dann Sync erneut ausführen:
-- npm run db:sync-profiles
-- ============================================
