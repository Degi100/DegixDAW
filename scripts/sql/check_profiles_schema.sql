-- ============================================
-- PROFILES TABLE - SCHEMA CHECK
-- ============================================
-- Dieses Script zeigt dir genau, welche Spalten existieren

-- 1. Zeige alle Spalten der profiles Tabelle
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Zeige ein paar Beispiel-Einträge
SELECT * 
FROM public.profiles 
LIMIT 3;

-- ============================================
-- EXPECTED COLUMNS (basierend auf Code):
-- ============================================
-- ✅ id (uuid)
-- ✅ full_name (text)
-- ✅ username (text)
-- ✅ created_at (timestamptz)
-- ❌ avatar_url (NICHT vorhanden - entfernt)
-- ❌ email (NICHT vorhanden - ist in auth.users)
-- ❌ role (NICHT vorhanden - entfernt)
