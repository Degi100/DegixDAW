-- ============================================================================
-- ISSUES SYSTEM SETUP
-- ============================================================================
-- Supabase-basiertes Issue-Tracking-System für Admin/Moderator
-- Features: Assignment, Labels, Comments, PR-Integration, Realtime Updates
-- ============================================================================

-- ============================================================================
-- 1. ISSUES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  labels TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT valid_status_transition CHECK (
    (status = 'done' AND completed_at IS NOT NULL) OR
    (status != 'done')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_created_by ON issues(created_by);
CREATE INDEX IF NOT EXISTS idx_issues_labels ON issues USING GIN(labels);

-- ============================================================================
-- 2. ISSUE COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Optional: Track what changed (e.g., status change reason)
  action_type TEXT CHECK (action_type IN ('comment', 'status_change', 'assignment', 'label_change'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user_id ON issue_comments(user_id);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Auto-update `updated_at` timestamp
CREATE OR REPLACE FUNCTION update_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set completed_at when status changes to 'done'
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  END IF;

  -- Clear completed_at if status changes away from 'done'
  IF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_issues_timestamp
BEFORE UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION update_issues_updated_at();

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- Issues Policies: Admin/Moderator only
CREATE POLICY "admin_mod_can_view_all_issues"
  ON issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "admin_mod_can_create_issues"
  ON issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "admin_mod_can_update_issues"
  ON issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "admin_mod_can_delete_issues"
  ON issues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Comments Policies: Admin/Moderator only
CREATE POLICY "admin_mod_can_view_comments"
  ON issue_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "admin_mod_can_create_comments"
  ON issue_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "admin_mod_can_delete_comments"
  ON issue_comments FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. REALTIME CONFIGURATION
-- ============================================================================

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_comments;

-- ============================================================================
-- 6. RPC FUNCTIONS
-- ============================================================================

-- Get all issues with assignee details
CREATE OR REPLACE FUNCTION get_issues_with_details()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  category TEXT,
  labels TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_by_id UUID,
  created_by_username TEXT,
  created_by_email TEXT,
  assigned_to_id UUID,
  assigned_to_username TEXT,
  assigned_to_email TEXT,
  comments_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or Moderator role required';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.description,
    i.status,
    i.priority,
    i.category,
    i.labels,
    i.created_at,
    i.updated_at,
    i.completed_at,
    i.metadata,
    i.created_by as created_by_id,
    creator.username as created_by_username,
    creator_auth.email as created_by_email,
    i.assigned_to as assigned_to_id,
    assignee.username as assigned_to_username,
    assignee_auth.email as assigned_to_email,
    COUNT(ic.id) as comments_count
  FROM issues i
  LEFT JOIN profiles creator ON i.created_by = creator.id
  LEFT JOIN auth.users creator_auth ON i.created_by = creator_auth.id
  LEFT JOIN profiles assignee ON i.assigned_to = assignee.id
  LEFT JOIN auth.users assignee_auth ON i.assigned_to = assignee_auth.id
  LEFT JOIN issue_comments ic ON i.id = ic.issue_id
  GROUP BY
    i.id, i.title, i.description, i.status, i.priority, i.category,
    i.labels, i.created_at, i.updated_at, i.completed_at, i.metadata,
    i.created_by, creator.username, creator_auth.email,
    i.assigned_to, assignee.username, assignee_auth.email
  ORDER BY
    CASE i.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    i.created_at DESC;
END;
$$;

-- Assign issue to user (with lock check)
CREATE OR REPLACE FUNCTION assign_issue(
  issue_id UUID,
  user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_assignee UUID;
  result JSONB;
BEGIN
  -- Check if user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or Moderator role required';
  END IF;

  -- Get current assignee
  SELECT assigned_to INTO current_assignee FROM issues WHERE id = issue_id;

  -- Check if already assigned to someone else
  IF current_assignee IS NOT NULL AND current_assignee != user_id THEN
    SELECT jsonb_build_object(
      'success', false,
      'error', 'Issue is already assigned to another user',
      'assigned_to', current_assignee
    ) INTO result;
    RETURN result;
  END IF;

  -- Assign issue
  UPDATE issues
  SET
    assigned_to = user_id,
    status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
  WHERE id = issue_id;

  SELECT jsonb_build_object(
    'success', true,
    'assigned_to', user_id
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Run this script in Supabase SQL Editor
-- Enables: Issue tracking, Comments, Assignment, Labels, PR-Integration
-- ============================================================================
