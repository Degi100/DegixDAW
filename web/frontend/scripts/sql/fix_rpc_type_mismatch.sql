-- ============================================================================
-- FIX RPC FUNCTION TYPE MISMATCH
-- ============================================================================
-- Problem: Type mismatch between function declaration and actual data types
-- Real Schema:
--   - profiles.username = TEXT
--   - auth.users.email = VARCHAR(255)
-- Fix: Match function return types to actual database schema
-- ============================================================================

DROP FUNCTION IF EXISTS get_issues_with_details();

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
  created_by_username TEXT,         -- ✅ FIXED: TEXT (matches profiles.username)
  created_by_email VARCHAR(255),    -- ✅ FIXED: VARCHAR(255) (matches auth.users.email)
  assigned_to_id UUID,
  assigned_to_username TEXT,        -- ✅ FIXED: TEXT (matches profiles.username)
  assigned_to_email VARCHAR(255),   -- ✅ FIXED: VARCHAR(255) (matches auth.users.email)
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

-- Verify function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_issues_with_details';
