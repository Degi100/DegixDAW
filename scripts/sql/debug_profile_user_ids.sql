-- ============================================
-- DEBUG: Profile vs Auth Users ID Check
-- ============================================

-- 1. Zeige alle Profile-IDs
SELECT id, full_name, username 
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Zeige alle Auth-User-IDs
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Prüfe ob Profile-IDs mit Auth-User-IDs übereinstimmen
SELECT 
  'profiles' as source,
  p.id,
  p.full_name,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Auth User existiert'
    ELSE '❌ Auth User FEHLT'
  END as status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Prüfe umgekehrt: Auth Users ohne Profile
SELECT 
  'auth.users' as source,
  u.id,
  u.email,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Profil existiert'
    ELSE '❌ Profil FEHLT'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- ============================================
-- LÖSUNG: Wenn Profile-IDs nicht mit Auth-IDs übereinstimmen
-- ============================================

-- Option A: Profile neu erstellen mit korrekten IDs
-- (Nur ausführen wenn nötig!)
/*
INSERT INTO public.profiles (id, full_name, username, created_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- Profile.id MUSS gleich auth.users.id sein!
-- Sonst schlagen alle Foreign Keys fehl.
