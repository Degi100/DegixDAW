-- ============================================
-- Show All Users (Auth + Profiles)
-- ============================================

-- 1. Overview Stats
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✅ Counts match!'
    ELSE '❌ Counts differ!'
  END as status;

-- 2. All Users with Profile Status
SELECT
  u.id,
  u.email,
  u.created_at as auth_created_at,
  u.confirmed_at,
  p.username,
  p.full_name,
  p.role,
  CASE
    WHEN p.id IS NOT NULL THEN '✅ Has Profile'
    ELSE '❌ No Profile'
  END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- 3. Profiles without Auth User (orphaned)
SELECT
  p.id,
  p.username,
  p.full_name,
  p.created_at,
  '❌ Orphaned (no auth user)' as status
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
)
ORDER BY p.created_at DESC;

-- 4. Auth Users without Profile (missing profile)
SELECT
  u.id,
  u.email,
  u.created_at,
  u.confirmed_at,
  '❌ Missing Profile' as status
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ORDER BY u.created_at DESC;
