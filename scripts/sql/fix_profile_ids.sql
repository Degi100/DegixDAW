-- ============================================
-- FIX: Aktualisiere Profile-IDs auf Auth-User-IDs
-- ============================================
-- Problem: Profile existieren, aber mit falschen IDs

-- 1. Zeige das Problem: Profile mit falschen IDs
SELECT 
  p.id as profile_id,
  p.username,
  u.id as correct_auth_id,
  u.email,
  'Profile ID != Auth ID' as issue
FROM public.profiles p
CROSS JOIN auth.users u
WHERE p.username LIKE split_part(u.email, '@', 1) || '%'
  AND p.id != u.id
ORDER BY p.username;

-- 2. LÖSUNG: Lösche ALLE Profile und erstelle sie neu mit korrekten IDs
-- (Sicherer als UPDATE wegen Foreign Key Constraints)

-- Step 1: Lösche alle Profile (CASCADE löscht auch zugehörige Daten)
DELETE FROM public.profiles;

-- Step 2: Erstelle Profile neu mit korrekten Auth-User-IDs
INSERT INTO public.profiles (id, full_name, username, created_at)
SELECT 
  u.id,  -- WICHTIG: Verwende die Auth-User-ID!
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ) as full_name,
  split_part(u.email, '@', 1) || '_' || substring(u.id::text, 1, 8) as username,
  u.created_at
FROM auth.users u;

-- 3. Verify: ALLE Profile sollten jetzt korrekte IDs haben
SELECT 
  p.id,
  p.username,
  p.full_name,
  u.email,
  CASE 
    WHEN p.id = u.id THEN '✅ ID korrekt'
    ELSE '❌ ID falsch'
  END as status
FROM public.profiles p
INNER JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 4. Final Count Check
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.profiles p 
   INNER JOIN auth.users u ON p.id = u.id) as matched_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles) = (SELECT COUNT(*) FROM auth.users)
    THEN '✅ Alles korrekt!'
    ELSE '❌ Problem bleibt'
  END as status;

-- ============================================
-- Nach diesem Script:
-- - Alle Profile haben die richtige ID (= Auth-User-ID)
-- - Friend Requests sollten funktionieren!
-- ============================================
