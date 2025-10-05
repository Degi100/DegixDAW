-- ============================================
-- MANUAL PROFILE FIX
-- ============================================
-- Profil für registrierten User erstellen

-- 1. Zeige alle Auth-Users ohne Profil
SELECT 
  u.id,
  u.email,
  u.created_at as auth_created,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Has Profile'
    ELSE '❌ No Profile'
  END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. Erstelle Profil für User ohne Profil
-- (Ersetze 'USER_EMAIL_HERE' mit der echten E-Mail-Adresse)
INSERT INTO public.profiles (
  id,
  full_name,
  username,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ) as full_name,
  COALESCE(
    u.raw_user_meta_data->>'username',
    split_part(u.email, '@', 1) || '_' || substring(u.id::text, 1, 6)
  ) as username,
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
-- Ersetze 'USER_EMAIL_HERE' mit der echten E-Mail-Adresse:
AND u.email = 'USER_EMAIL_HERE';

-- 3. Verifiziere Profil-Erstellung
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.username,
  p.created_at as profile_created
FROM auth.users u
INNER JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'USER_EMAIL_HERE';

-- 4. Zeige aktualisierten Status
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL) as users_without_profile;
