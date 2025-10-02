-- Create RPC function to get all users for admin panel
-- Execute this in your Supabase SQL Editor: Click "+ New query" and paste this code

-- First, drop the function if it exists
DROP FUNCTION IF EXISTS get_all_users();

-- Then create it fresh with correct types
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email character varying(255),
  created_at timestamptz,
  last_sign_in_at timestamptz,
  username character varying(255),
  full_name character varying(255),
  profile_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email::character varying(255),
    au.created_at,
    au.last_sign_in_at,
    p.username::character varying(255),
    p.full_name::character varying(255),
    p.created_at as profile_created_at
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.user_id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- Test the RPC function:
-- SELECT * FROM get_all_users();

-- DEBUG: Check profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- DEBUG: Check if profile was created
-- SELECT * FROM profiles WHERE user_id = 'USER_ID_HERE';

-- DEBUG: Check auth.users metadata
-- SELECT id, email, raw_user_meta_data, created_at
-- FROM auth.users
-- WHERE id = 'USER_ID_HERE';
