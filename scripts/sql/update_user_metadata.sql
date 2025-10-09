-- ============================================================================
-- UPDATE USER METADATA RPC FUNCTION
-- ============================================================================
-- Allows admins to update auth.users.raw_user_meta_data fields
-- Required for updating allowed_admin_routes, is_admin, is_moderator
--
-- Usage:
--   SELECT update_user_metadata(
--     'user-uuid-here',
--     '{"allowed_admin_routes": ["issues", "users"]}'::jsonb
--   );
--
-- Security: Only callable by admins (via RLS or application logic)
-- ============================================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS update_user_metadata(uuid, jsonb);

-- Create function to update user_metadata
CREATE OR REPLACE FUNCTION update_user_metadata(
  target_user_id uuid,
  metadata_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public
AS $$
DECLARE
  current_metadata jsonb;
  updated_metadata jsonb;
  result jsonb;
BEGIN
  -- Security Check: Only admins can call this
  IF NOT (
    SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    OR auth.jwt() ->> 'email' = current_setting('app.super_admin_email', true)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update user metadata';
  END IF;

  -- Get current metadata
  SELECT raw_user_meta_data INTO current_metadata
  FROM auth.users
  WHERE id = target_user_id;

  IF current_metadata IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;

  -- Merge current metadata with updates (deep merge)
  updated_metadata := current_metadata || metadata_updates;

  -- Update auth.users.raw_user_meta_data
  UPDATE auth.users
  SET raw_user_meta_data = updated_metadata,
      updated_at = now()
  WHERE id = target_user_id;

  -- Return the updated metadata for verification
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'metadata', updated_metadata
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle authorization)
GRANT EXECUTE ON FUNCTION update_user_metadata(uuid, jsonb) TO authenticated;

-- Add comment
COMMENT ON FUNCTION update_user_metadata IS
'Updates auth.users.raw_user_meta_data for a given user. Only callable by admins. Used for setting allowed_admin_routes, role flags, etc.';

-- ============================================================================
-- IMPROVED get_all_users_with_metadata TO INCLUDE user_metadata
-- ============================================================================
-- Fix: Return user_metadata so frontend can read allowed_admin_routes

DROP FUNCTION IF EXISTS get_all_users_with_metadata();

CREATE OR REPLACE FUNCTION get_all_users_with_metadata()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  username text,
  full_name text,
  profile_created_at timestamptz,
  email_confirmed_at timestamptz,
  phone text,
  avatar_url text,
  role text,
  is_active boolean,
  user_metadata jsonb  -- ← NEW: Include metadata for frontend
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security: Only admins can call this
  IF NOT (
    SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    OR auth.jwt() ->> 'email' = current_setting('app.super_admin_email', true)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view all users';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    p.username,
    p.full_name,
    p.created_at as profile_created_at,
    au.email_confirmed_at,
    p.phone,
    p.avatar_url,
    COALESCE(p.role, 'user')::text as role,
    COALESCE(p.is_active, true) as is_active,
    au.raw_user_meta_data as user_metadata  -- ← Return full metadata
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users_with_metadata() TO authenticated;

COMMENT ON FUNCTION get_all_users_with_metadata IS
'Returns all users with profile data and user_metadata. Only callable by admins. Used in Admin User Management.';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ update_user_metadata() function created successfully!';
  RAISE NOTICE '✅ get_all_users_with_metadata() updated to include user_metadata!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Update frontend to call update_user_metadata RPC';
  RAISE NOTICE '   2. Test: Edit user → Set allowed_admin_routes → Refresh';
  RAISE NOTICE '   3. Verify: Checkbox stays checked after refresh';
END $$;
