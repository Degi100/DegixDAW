-- ============================================
-- AUTO CREATE PROFILE TRIGGER
-- ============================================
-- Erstellt automatisch ein Profil für neue Auth-Users

-- Trigger-Funktion für neue Auth-Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Erstelle Profil für neuen User
  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    created_at,
    updated_at,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1) || '_' || substring(NEW.id::text, 1, 6)
    ),
    NEW.created_at,
    NOW(),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Aktualisiere falls Profil bereits existiert
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen (falls noch nicht existiert)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test: Zeige alle Profile ohne entsprechende Auth-Users
SELECT 
  p.id,
  p.full_name,
  p.username,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Has Auth User'
    ELSE '❌ Missing Auth User'
  END as auth_status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- Count Check
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles) = (SELECT COUNT(*) FROM auth.users)
    THEN '✅ Counts match!'
    ELSE '❌ Counts differ!'
  END as status;
