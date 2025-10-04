-- ============================================
-- ADD BIO COLUMN TO PROFILES TABLE
-- ============================================

-- 1. Prüfe ob bio Spalte bereits existiert
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'bio';

-- 2. Füge bio Spalte hinzu falls sie nicht existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    RAISE NOTICE 'Bio column added to profiles table';
  ELSE
    RAISE NOTICE 'Bio column already exists';
  END IF;
END $$;

-- 3. Zeige aktualisierte Tabellenstruktur
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
