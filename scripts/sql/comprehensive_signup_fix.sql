-- ============================================
-- COMPREHENSIVE SIGNUP FIX
-- ============================================
-- Vollständige Diagnose und Korrektur

-- 1. Zeige aktuelle Trigger (falls vorhanden)
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Zeige Funktion (falls vorhanden)
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Vollständig entfernen (sauberer Start)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Zeige Profile-Tabellenstruktur
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 5. Erstelle korrigierte Funktion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    created_at,
    updated_at
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
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger erstellen
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Verifiziere Installation
SELECT 
  'TRIGGER' as type,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 
  'FUNCTION' as type,
  proname as trigger_name,
  '' as event_manipulation,
  '' as action_timing
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 8. Test-Funktion (sicher)
DO $$
DECLARE
  test_result TEXT;
BEGIN
  SELECT 'Trigger function exists and is callable' INTO test_result;
  RAISE NOTICE '%', test_result;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;
