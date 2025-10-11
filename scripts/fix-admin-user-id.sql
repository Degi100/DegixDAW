-- Fix user_id for admin profile
-- Run this in Supabase SQL Editor

UPDATE profiles
SET user_id = '010b60b9-0ef1-4d4a-af3d-822792207dda'
WHERE username = 'admin' AND user_id IS NULL;

-- Verify the fix
SELECT
  id,
  user_id,
  username,
  full_name,
  role
FROM profiles
WHERE username = 'admin';
