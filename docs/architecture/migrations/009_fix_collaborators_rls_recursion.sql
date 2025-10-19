-- ============================================
-- Migration 009: Fix Infinite Recursion in Collaborators RLS
-- ============================================
-- CRITICAL FIX: The previous policies caused infinite recursion
-- This migration drops and recreates them with simpler logic

-- ============================================
-- 1. DROP EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can read project collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Users can invite collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Users can update collaborator records" ON public.project_collaborators;
DROP POLICY IF EXISTS "Users can remove collaborators" ON public.project_collaborators;

-- ============================================
-- 2. SIMPLER READ POLICY (No Recursion)
-- ============================================

-- Users can read collaborators if:
-- 1. They are the invitee (own record)
-- 2. They are the project owner
-- 3. The project is public

CREATE POLICY "Users can read project collaborators"
  ON public.project_collaborators
  FOR SELECT
  USING (
    -- User is the invitee (can always see their own invite)
    user_id = auth.uid()
    OR
    -- User is project owner (can see all collaborators)
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.creator_id = auth.uid()
    )
    OR
    -- Project is public (anyone can see collaborators)
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.is_public = true
    )
  );

-- ============================================
-- 3. SIMPLER INSERT POLICY
-- ============================================

-- Only project owners can invite collaborators
-- (Removed can_invite_others check to avoid recursion)

CREATE POLICY "Users can invite collaborators"
  ON public.project_collaborators
  FOR INSERT
  WITH CHECK (
    -- User is project owner
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.creator_id = auth.uid()
    )
  );

-- ============================================
-- 4. SIMPLER UPDATE POLICY
-- ============================================

-- Users can update collaborator records if:
-- 1. They are updating their own record (to accept invite)
-- 2. They are the project owner (to change permissions)

CREATE POLICY "Users can update collaborator records"
  ON public.project_collaborators
  FOR UPDATE
  USING (
    -- User is updating their own record (e.g., accepting invite)
    user_id = auth.uid()
    OR
    -- User is project owner
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.creator_id = auth.uid()
    )
  );

-- ============================================
-- 5. SIMPLER DELETE POLICY
-- ============================================

-- Users can delete collaborator records if:
-- 1. They are removing themselves (leaving project)
-- 2. They are the project owner (removing others)

CREATE POLICY "Users can remove collaborators"
  ON public.project_collaborators
  FOR DELETE
  USING (
    -- User is removing themselves
    user_id = auth.uid()
    OR
    -- User is project owner
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.creator_id = auth.uid()
    )
  );

-- ============================================
-- Migration Complete
-- ============================================

-- Verify policies were created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_collaborators'
    AND schemaname = 'public'
  ) THEN
    RAISE NOTICE '✅ Migration 009 Complete: RLS recursion fixed for project_collaborators';
  ELSE
    RAISE EXCEPTION '❌ Migration 009 Failed: RLS policies not created';
  END IF;
END $$;
