-- ============================================
-- QUICK FIX: Sync Profiles mit Auth Users
-- ============================================
-- Dieses Script stellt sicher, dass alle Profile
-- mit Auth Users übereinstimmen

-- 2. Zeige Problem
SELECT 
  COUNT(*) as total_profiles,
  COUNT(DISTINCT p.id) as unique_profiles,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users
FROM public.profiles p;

-- 3. Erstelle fehlende Profile für Auth Users
INSERT INTO public.profiles (id, full_name, username, created_at)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 2)
  ) as full_name,
  COALESCE(
    u.raw_user_meta_data->>'username',
    split_part(u.email, '@', 2) || '_' || substring(u.id::text, 1, 6)
  ) as username,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 2 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (username) DO UPDATE
SET username = EXCLUDED.username || '_' || substring(EXCLUDED.id::text, 2, 8);-- 3. Verify - Zeige alle Profile mit Auth-Status
SELECT 
  p.id,
  p.full_name,
  p.username,
  u.email,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_auth_user
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 4. Count Check
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles) = (SELECT COUNT(*) FROM auth.users)
    THEN '✅ Counts match!'
    ELSE '❌ Counts differ!'
  END as status;

-- ============================================
-- Nach diesem Script sollten alle Auth-User
-- ein entsprechendes Profil haben!
-- ============================================
