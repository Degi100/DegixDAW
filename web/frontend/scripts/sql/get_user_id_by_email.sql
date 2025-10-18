-- ============================================================================
-- RPC Function: get_user_id_by_email
--
-- Returns profile.id for a given email address
-- Joins auth.users with profiles table
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with function owner's permissions
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT p.id INTO user_id
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE u.email = user_email
  LIMIT 1;

  RETURN user_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO service_role;

-- Test (replace with your email):
-- SELECT get_user_id_by_email('rene.degering2014@gmail.com');
