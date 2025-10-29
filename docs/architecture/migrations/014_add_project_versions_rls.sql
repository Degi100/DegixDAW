-- ============================================
-- Migration 014: Add RLS Policies for project_versions
-- ============================================
-- Created: 2025-10-29
-- Description: Enable Row-Level Security for project_versions table

-- Enable RLS
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read versions of their own projects + shared projects
CREATE POLICY "users_read_project_versions"
ON project_versions FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects
    WHERE creator_id = auth.uid()
    OR id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
    OR is_public = true
  )
);

-- Policy: Users can create versions for their own projects + collaborator projects (with permission)
CREATE POLICY "users_create_project_versions"
ON project_versions FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT project_id FROM project_collaborators
    WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
    AND (role IN ('admin', 'mixer', 'contributor'))
  )
);

-- Policy: Only creator can delete versions
CREATE POLICY "creator_delete_project_versions"
ON project_versions FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects WHERE creator_id = auth.uid()
  )
);

-- Comments
COMMENT ON POLICY "users_read_project_versions" ON project_versions IS
'Users can read versions of projects they own, collaborate on, or are public';

COMMENT ON POLICY "users_create_project_versions" ON project_versions IS
'Project owner and collaborators with admin/mixer/contributor role can create versions';

COMMENT ON POLICY "creator_delete_project_versions" ON project_versions IS
'Only project creator can delete versions';
