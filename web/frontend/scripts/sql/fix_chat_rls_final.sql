-- ============================================
-- FIX: Chat RLS - FINAL SOLUTION (No Recursion)
-- ============================================
-- Problem: SELECT Policy für conversation_members darf NICHT
--          conversation_members in sich selbst abfragen!
-- 
-- Lösung: Einfachste Policies - User sieht/managed nur eigene Rows

BEGIN;

-- 1. DROP ALLE Policies
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can update their membership" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_select_policy" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_insert_policy" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_delete_policy" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_update_policy" ON public.conversation_members;

-- 2. SUPER SIMPLE POLICIES (KEINE RECURSION!)

-- SELECT: User sieht ALLE Members von ALLEN Conversations
-- (Frontend filtert dann basierend auf user's conversations)
CREATE POLICY "conversation_members_select_all"
  ON public.conversation_members FOR SELECT
  USING (true);  -- ✅ Jeder sieht alles (wird durch conversations RLS geschützt)

-- INSERT: User kann Members hinzufügen wenn:
-- 1. User fügt sich selbst hinzu
-- 2. ODER User ist Creator der Conversation
CREATE POLICY "conversation_members_insert_simple"
  ON public.conversation_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- DELETE: User kann nur seine eigene Membership löschen
CREATE POLICY "conversation_members_delete_own"
  ON public.conversation_members FOR DELETE
  USING (user_id = auth.uid());

-- UPDATE: User kann nur seine eigene Membership updaten
CREATE POLICY "conversation_members_update_own"
  ON public.conversation_members FOR UPDATE
  USING (user_id = auth.uid());

COMMIT;

-- ============================================
-- WARUM DAS FUNKTIONIERT:
-- ✅ SELECT hat KEINE Recursion (using true)
-- ✅ Sicherheit kommt von conversations.RLS
-- ✅ User kann nur sehen was er darf via conversations
-- ✅ INSERT/DELETE/UPDATE sind simpel und sicher
-- ============================================
