-- ============================================
-- Migration 008: RLS Policies for Project Collaborators
-- ============================================
-- IMPORTANT: This migration adds Row-Level Security policies for project_collaborators table
-- Ensures users can only access/manage collaborators based on their permissions.

-- ============================================
-- 1. ENABLE RLS
-- ============================================

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. READ POLICY (SELECT)
-- ============================================

-- Users can read collaborators if:
-- 1. They are the project owner
-- 2. They are a collaborator on the project (accepted or pending)
-- 3. The project is public

CREATE POLICY "Users can read project collaborators"
  ON public.project_collaborators
  FOR SELECT
  USING (
    -- User is the invitee (can see their own invite)
    user_id = auth.uid()
    OR
    -- User is project owner
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.creator_id = auth.uid()
    )
    OR
    -- User is a collaborator on the project
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_collaborators.project_id
      AND pc.user_id = auth.uid()
      AND pc.accepted_at IS NOT NULL
    )
    OR
    -- Project is public
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.is_public = true
    )
  );

-- ============================================
-- 3. CREATE POLICY (INSERT)
-- ============================================

-- Users can invite collaborators if:
-- 1. They are the project owner
-- 2. They are a collaborator with can_invite_others permission

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
    OR
    -- User has can_invite_others permission
    EXISTS (
      SELECT 1 FROM public.project_collaborators pc
      WHERE pc.project_id = project_collaborators.project_id
      AND pc.user_id = auth.uid()
      AND pc.accepted_at IS NOT NULL
      AND pc.can_invite_others = true
    )
  );

-- ============================================
-- 4. UPDATE POLICY
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
  )
  WITH CHECK (
    -- Same conditions as USING
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_collaborators.project_id
      AND p.creator_id = auth.uid()
    )
  );

-- ============================================
-- 5. DELETE POLICY
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
-- 6. CREATE INDEXES (Performance)
-- ============================================

-- Index for filtering by project
CREATE INDEX IF NOT EXISTS idx_collaborators_project_id
  ON public.project_collaborators(project_id);

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id
  ON public.project_collaborators(user_id);

-- Index for pending invites
CREATE INDEX IF NOT EXISTS idx_collaborators_pending
  ON public.project_collaborators(user_id, accepted_at)
  WHERE accepted_at IS NULL;

-- Index for active collaborators
CREATE INDEX IF NOT EXISTS idx_collaborators_active
  ON public.project_collaborators(project_id, accepted_at)
  WHERE accepted_at IS NOT NULL;

-- Index for users who can invite others
CREATE INDEX IF NOT EXISTS idx_collaborators_can_invite
  ON public.project_collaborators(project_id, can_invite_others)
  WHERE can_invite_others = true AND accepted_at IS NOT NULL;

-- Composite index for permission checks
CREATE INDEX IF NOT EXISTS idx_collaborators_project_user
  ON public.project_collaborators(project_id, user_id);

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
    RAISE NOTICE '✅ Migration 008 Complete: RLS policies created for project_collaborators';
  ELSE
    RAISE EXCEPTION '❌ Migration 008 Failed: RLS policies not created';
  END IF;
END $$;
