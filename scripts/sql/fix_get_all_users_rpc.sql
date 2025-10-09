-- ============================================================================
-- FIX: get_all_users_with_metadata() - Remove non-existent columns
-- ============================================================================
-- Problem: Function tries to access p.avatar_url and p.phone which don't exist
-- Solution: Remove these columns from the SELECT, get avatar from user_metadata
-- ============================================================================

DROP FUNCTION IF EXISTS get_all_users_with_metadata();

CREATE OR REPLACE FUNCTION get_all_users_with_metadata()
RETURNS TABLE (
  id uuid,
  email character varying(255),
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  username text,
  full_name text,
  phone text,  -- Will be NULL (profiles doesn't have this)
  avatar_url text,  -- From user_metadata, not profiles
  role text,
  is_active boolean,
  profile_created_at timestamptz,
  user_metadata jsonb  -- Renamed from 'metadata' to be more explicit
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin (via profile role OR user_metadata OR super admin email)
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    INNER JOIN auth.users au ON p.id = au.id
    WHERE p.id = auth.uid()
    AND (
      p.role = 'admin'
      OR (au.raw_user_meta_data->>'is_admin')::boolean = true
      OR au.email = current_setting('app.super_admin_email', true)
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::character varying(255),
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    p.username,
    p.full_name,
    NULL::text as phone,  -- profiles doesn't have phone field
    (au.raw_user_meta_data->>'avatar_url')::text as avatar_url,  -- Get from user_metadata
    COALESCE(p.role, 'user')::text as role,
    COALESCE(p.is_active, true) as is_active,
    p.created_at as profile_created_at,
    au.raw_user_meta_data as user_metadata
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users_with_metadata() TO authenticated;

-- Verify
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_all_users_with_metadata';
