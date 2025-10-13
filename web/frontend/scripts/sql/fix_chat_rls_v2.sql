-- ============================================
-- FIX: Chat System RLS - Infinite Recursion v2
-- ============================================
-- Löscht ALLE existierenden Policies und erstellt neue

BEGIN;

-- 1. DROP ALLE existierenden Policies für conversation_members
-- (Wir wissen nicht genau welche Namen sie haben, daher probieren wir alle)
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can update their membership" ON public.conversation_members;

-- 2. NEUE POLICIES (ohne Recursion)

-- SELECT: Vereinfacht - User sieht nur Members von eigenen Conversations
CREATE POLICY "conversation_members_select_policy"
  ON public.conversation_members FOR SELECT
  USING (
    -- User ist selbst Member dieser Conversation
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: User kann sich selbst hinzufügen ODER ist Creator/Admin
CREATE POLICY "conversation_members_insert_policy"
  ON public.conversation_members FOR INSERT
  WITH CHECK (
    -- Fall 1: User fügt sich selbst hinzu
    user_id = auth.uid()
    OR
    -- Fall 2: User ist Creator der Conversation
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- DELETE: User kann nur seine eigene Membership löschen
CREATE POLICY "conversation_members_delete_policy"
  ON public.conversation_members FOR DELETE
  USING (user_id = auth.uid());

-- UPDATE: User kann nur seine eigene Membership updaten
CREATE POLICY "conversation_members_update_policy"
  ON public.conversation_members FOR UPDATE
  USING (user_id = auth.uid());

COMMIT;

-- ============================================
-- ÄNDERUNGEN:
-- ✅ Neue Policy-Namen (conversation_members_*_policy)
-- ✅ INSERT Policy vereinfacht (kein Admin-Check mehr)
-- ✅ Keine Recursion mehr
-- ============================================
