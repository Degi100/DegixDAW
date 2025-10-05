-- ============================================
-- DIAGNOSE SIGNUP ERROR
-- ============================================

-- 1. Prüfe ob Trigger existiert
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Prüfe Trigger-Funktion
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  prokind as kind
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Teste Trigger-Funktion manuell
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
BEGIN
  -- Simuliere neuen User
  RAISE NOTICE 'Testing trigger function with user_id: %', test_user_id;
  
  -- Teste die Funktion
  PERFORM public.handle_new_user();
  
  RAISE NOTICE 'Trigger test completed successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Trigger test failed: %', SQLERRM;
END $$;

-- 4. Prüfe Datenbank-Logs (falls verfügbar)
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE tablename = 'profiles' 
ORDER BY attname;

-- 5. Zeige letzte Fehler (falls PostgreSQL-Logs verfügbar)
-- Hinweis: Diese Abfrage funktioniert nur wenn logging aktiviert ist
