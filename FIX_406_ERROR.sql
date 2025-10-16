-- FIX 406 Not Acceptable Error
-- Problem: RLS Policies blockieren Profile-Queries

-- 1. PRÜFE: Sind RLS Policies aktiv?
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- 2. ZEIGE: Welche Policies existieren?
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- 3. FIX: Policies für profiles Tabelle

-- Lösche alte/fehlerhafte Policies (falls vorhanden)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Erstelle korrekte Policies

-- Policy 1: Jeder authentifizierte User kann alle Profile SEHEN
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Anonyme User können öffentliche Profile sehen (optional)
CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
TO anon
USING (true);

-- Policy 3: User kann nur sein eigenes Profil bearbeiten
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: User kann nur sein eigenes Profil löschen (optional)
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. PRÜFE: Policies wurden erstellt
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;

-- 5. TEST: Query sollte jetzt funktionieren
SELECT username, full_name
FROM profiles
WHERE user_id = auth.uid();

-- ========================================
-- FIX für message_read_receipts Tabelle
-- ========================================

-- 6. PRÜFE: message_read_receipts Policies
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'message_read_receipts';

-- 7. FIX: Policies für message_read_receipts

-- Lösche alte Policies
DROP POLICY IF EXISTS "Users can view read receipts" ON message_read_receipts;
DROP POLICY IF EXISTS "Users can create read receipts" ON message_read_receipts;

-- Policy 1: Authentifizierte User können alle Read Receipts sehen
CREATE POLICY "Authenticated users can view read receipts"
ON message_read_receipts FOR SELECT
TO authenticated
USING (true);

-- Policy 2: User kann Read Receipts für eigene Nachrichten erstellen
CREATE POLICY "Users can create own read receipts"
ON message_read_receipts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 3: User kann eigene Read Receipts aktualisieren
CREATE POLICY "Users can update own read receipts"
ON message_read_receipts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 8. FERTIG - Prüfe alle Policies
SELECT
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'message_read_receipts')
ORDER BY tablename, policyname;
