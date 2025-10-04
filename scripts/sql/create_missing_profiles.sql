-- ============================================
-- DIREKTER FIX: Erstelle fehlende Profile
-- ============================================
-- Dieses Script erstellt Profile für die 5 Auth-Users

-- Erstelle Profile für ALLE Auth-Users die noch keins haben
INSERT INTO public.profiles (id, full_name, username, created_at)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ) as full_name,
  split_part(u.email, '@', 1) || '_' || substring(u.id::text, 1, 8) as username,
  u.created_at
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles);

-- Verify: Zeige alle neu erstellten Profile
SELECT 
  p.id,
  p.username,
  p.full_name,
  u.email,
  '✅ Neu erstellt' as status
FROM public.profiles p
INNER JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- Count Check
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles) = (SELECT COUNT(*) FROM auth.users)
    THEN '✅ Counts match!'
    ELSE '❌ Counts differ - check queries above!'
  END as status;

-- ============================================
-- Nach diesem Script solltest du 5 Profile haben!
-- ============================================
