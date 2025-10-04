-- ============================================
-- FIX: Conversations RLS - SUPER PERMISSIVE
-- ============================================
-- Für Testing: ALLE Policies komplett offen!
-- ⚠️ NUR FÜR ENTWICKLUNG/TESTING!

BEGIN;

-- 1. DROP ALLE conversations Policies
DROP POLICY IF EXISTS "Users can view conversations they are member of" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_authenticated" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_any" ON public.conversations;
DROP POLICY IF EXISTS "Conversation admins can update" ON public.conversations;

-- 2. SUPER PERMISSIVE POLICIES (Testing Only!)

-- SELECT: Jeder sieht alles
CREATE POLICY "conversations_select_all"
  ON public.conversations FOR SELECT
  USING (true);

-- INSERT: Jeder kann erstellen
CREATE POLICY "conversations_insert_all"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

-- UPDATE: Jeder kann updaten
CREATE POLICY "conversations_update_all"
  ON public.conversations FOR UPDATE
  USING (true);

-- DELETE: Jeder kann löschen
CREATE POLICY "conversations_delete_all"
  ON public.conversations FOR DELETE
  USING (true);

COMMIT;

-- ============================================
-- STATUS: ⚠️ TESTING MODE - KEINE SICHERHEIT!
-- Nach erfolgreichem Test: Policies wieder strenger machen!
-- ============================================
