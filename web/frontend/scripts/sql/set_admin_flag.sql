-- Set is_admin flag for super admin user
-- This updates the user_metadata JSON field to include is_admin: true

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'rene.degering2014@gmail.com';

-- Verify the update
SELECT 
  email, 
  raw_user_meta_data->>'is_admin' as is_admin_flag,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'rene.degering2014@gmail.com';
