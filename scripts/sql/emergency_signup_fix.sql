-- ============================================
-- EMERGENCY SIGNUP FIX
-- ============================================
-- Trigger komplett entfernen für Tests

-- 1. Trigger entfernen (falls vorhanden)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Funktion entfernen (falls vorhanden)  
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Verifiziere Entfernung
SELECT 
  trigger_name,
  proname as function_name
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 
  'TRIGGER_REMOVED' as trigger_name,
  proname as function_name
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Zeige Status
SELECT 'TRIGGER_EMERGENCY_FIX_APPLIED' as status;
