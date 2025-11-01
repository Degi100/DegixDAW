-- ============================================
-- Create Missing Profiles NOW
-- ============================================

-- Create profiles for the 2 missing users
INSERT INTO public.profiles (id, full_name, username, created_at)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as full_name,
  split_part(u.email, '@', 1) || '_' || substring(u.id::text, 1, 6) as username,
  u.created_at
FROM auth.users u
WHERE u.id IN (
  'b47e3cbc-ef31-4cd4-94f9-9f7f5e6f7474',  -- mindrim.music@gmail.com
  '83e2f7e3-5892-4c10-8720-49f405678f1b'   -- vulkanstudio@e.mail.de
)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT
  u.id,
  u.email,
  p.username,
  p.full_name,
  CASE
    WHEN p.id IS NOT NULL THEN '✅ Profile Created'
    ELSE '❌ Still Missing'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id IN (
  'b47e3cbc-ef31-4cd4-94f9-9f7f5e6f7474',
  '83e2f7e3-5892-4c10-8720-49f405678f1b'
)
ORDER BY u.created_at DESC;
