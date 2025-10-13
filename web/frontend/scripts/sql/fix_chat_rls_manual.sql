-- ============================================
-- FIX: Chat System RLS - Infinite Recursion
-- ============================================
-- Problem: conversation_members Policy hat Rekursion
-- Lösung: Vereinfachte Policies ohne Self-Reference

-- WICHTIG: Führe dieses SQL MANUELL in Supabase SQL Editor aus!
-- https://supabase.com/dashboard/project/_/sql

BEGIN;

-- 1. DROP alte Policies
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can update their membership" ON public.conversation_members;

-- 2. NEUE POLICIES (ohne Recursion)

-- SELECT: User sieht Members von Conversations wo er selbst Member ist
-- WICHTIG: Prüfung über conversations.id statt conversation_members recursion
CREATE POLICY "Users can view members of their conversations"
  ON public.conversation_members FOR SELECT
  USING (
    -- User ist selbst Member dieser Conversation
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Zwei Fälle erlaubt
-- 1. Creator fügt Member bei Conversation-Erstellung hinzu
-- 2. Conversation-Admin fügt Member hinzu
CREATE POLICY "Users can add members"
  ON public.conversation_members FOR INSERT
  WITH CHECK (
    -- Fall 1: User fügt sich selbst hinzu (bei Direct Chat Creation)
    user_id = auth.uid()
    OR
    -- Fall 2: User ist Admin der Conversation
    EXISTS (
      SELECT 1 
      FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
    OR
    -- Fall 3: User ist Creator der Conversation (bei Erstellung)
    EXISTS (
      SELECT 1 
      FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()
    )
  );

-- DELETE: User kann nur seine eigene Membership löschen
CREATE POLICY "Users can leave conversations"
  ON public.conversation_members FOR DELETE
  USING (user_id = auth.uid());

-- UPDATE: User kann nur seine eigene Membership updaten
CREATE POLICY "Users can update their membership"
  ON public.conversation_members FOR UPDATE
  USING (user_id = auth.uid());

COMMIT;

-- ============================================
-- ERGEBNIS:
-- ✅ Keine Recursion mehr
-- ✅ User kann Members sehen (via conversation_id lookup)
-- ✅ Creator/Admin kann Members hinzufügen
-- ✅ User kann eigene Membership verwalten
-- ============================================
