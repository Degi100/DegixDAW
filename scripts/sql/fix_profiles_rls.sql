-- ============================================
-- PROFILES TABLE - RLS POLICIES FOR SOCIAL
-- ============================================
-- Diese Policies ermöglichen es Benutzern, Profile anderer Benutzer zu sehen
-- für die Social-Features (Suche, Freunde, Follower)

-- Prüfen ob RLS aktiv ist
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Falls RLS nicht aktiv ist, aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Prüfe existierende Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- ============================================
-- WICHTIG: Diese Policy erlaubt ALLEN authentifizierten Benutzern,
-- alle Profile zu LESEN (für Benutzersuche)
-- ============================================

-- Lösche alte restrictive Policy falls vorhanden
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Erstelle neue Policy: Alle können alle Profile sehen (READ-ONLY)
CREATE POLICY "Anyone can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Optional: Benutzer können nur ihr eigenes Profil bearbeiten
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Optional: Benutzer können nur ihr eigenes Profil einfügen
CREATE POLICY "Users can insert own profile" 
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- VERIFY: Prüfe ob Policies korrekt sind
-- ============================================
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- ============================================
-- TEST: Prüfe ob Profile abrufbar sind
-- ============================================
-- Führe das als eingeloggter User aus:
SELECT id, full_name, username, created_at 
FROM public.profiles 
LIMIT 5;

-- ============================================
-- DONE! ✅
-- ============================================
-- Nach Ausführung sollte die Benutzersuche funktionieren!
