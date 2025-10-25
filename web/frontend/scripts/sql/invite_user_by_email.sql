-- ============================================
-- RPC Function: Invite User by Email
-- This function calls Supabase Auth API server-side
-- ============================================

-- NOTE: This requires Supabase to have pg_net extension enabled
-- and proper configuration to call auth.admin APIs

-- For now, we'll create a simpler approach:
-- Store pending invitations in a table, and use Supabase's built-in invite flow

CREATE TABLE IF NOT EXISTS pending_email_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permissions JSONB NOT NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, accepted, expired

  UNIQUE(email, project_id)
);

-- RLS Policies
ALTER TABLE pending_email_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see invitations they sent
CREATE POLICY "Users can view their sent invitations"
  ON pending_email_invitations
  FOR SELECT
  USING (invited_by = auth.uid());

-- Users can create invitations for projects they own or can invite to
CREATE POLICY "Users can create invitations"
  ON pending_email_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_id AND creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = pending_email_invitations.project_id
      AND user_id = auth.uid()
      AND can_invite_others = true
    )
  );

COMMENT ON TABLE pending_email_invitations IS 'Stores pending email invitations for users not yet registered';
