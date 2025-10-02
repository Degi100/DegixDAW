-- Create RPC function to get all users for admin panel
-- This function returns all users from auth.users with their profile data
-- Execute this in your Supabase SQL editor

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  username text,
  full_name text,
  profile_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admins to execute this function
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    p.username,
    p.full_name,
    p.created_at as profile_created_at
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.user_id
  ORDER BY au.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (the function checks for admin internally)
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;