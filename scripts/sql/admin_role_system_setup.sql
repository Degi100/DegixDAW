-- =====================================================
-- Admin Role System Setup
-- =====================================================
-- Adds role management, RLS policies, and super-admin protection
-- Execute in Supabase SQL Editor

-- =====================================================
-- 1. Update profiles table (add role column if missing)
-- =====================================================

-- Check if role column exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

    COMMENT ON COLUMN profiles.role IS 'User role: user (default), moderator, or admin';
  END IF;
END$$;

-- =====================================================
-- 2. Update RPC function to include role
-- =====================================================

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
  phone text,
  avatar_url text,
  role text,
  is_active boolean,
  profile_created_at timestamptz,
  metadata jsonb
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
    p.phone,
    p.avatar_url,
    COALESCE(p.role, 'user')::text as role,
    COALESCE(p.is_active, true) as is_active,
    p.created_at as profile_created_at,
    au.raw_user_meta_data as metadata
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users_with_metadata() TO authenticated;

-- =====================================================
-- 3. RLS Policy for Role Updates (Admin Only)
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;
DROP POLICY IF EXISTS "Super admin protection" ON profiles;

-- Allow admins to update profiles (including roles)
CREATE POLICY "Admins can update user roles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  -- Current user is admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  -- AND target user is not the super admin (protected by email)
  AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = profiles.id
    AND email = current_setting('app.super_admin_email', true)
  )
)
WITH CHECK (
  -- Same conditions as USING clause
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = profiles.id
    AND email = current_setting('app.super_admin_email', true)
  )
);

-- =====================================================
-- 4. Function to sync role to user_metadata
-- =====================================================

CREATE OR REPLACE FUNCTION sync_role_to_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update auth.users metadata when role changes
  IF NEW.role != OLD.role OR (NEW.role IS NOT NULL AND OLD.role IS NULL) THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{is_admin}',
      to_jsonb(NEW.role = 'admin')
    )
    WHERE id = NEW.id;

    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{is_moderator}',
      to_jsonb(NEW.role = 'moderator')
    )
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS sync_role_metadata_trigger ON profiles;
CREATE TRIGGER sync_role_metadata_trigger
AFTER UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_role_to_user_metadata();

-- =====================================================
-- 5. Super Admin Protection Function
-- =====================================================

CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  super_admin_email text;
  user_email text;
BEGIN
  -- Get super admin email from app settings
  super_admin_email := current_setting('app.super_admin_email', true);

  -- Get user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  RETURN user_email = super_admin_email;
END;
$$;

-- =====================================================
-- 6. Prevent Super Admin Role Changes
-- =====================================================

CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  super_admin_email text;
  user_email text;
BEGIN
  -- Get super admin email from app settings
  super_admin_email := current_setting('app.super_admin_email', true);

  -- Get user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- If this is the super admin, prevent role changes
  IF user_email = super_admin_email AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Cannot change super admin role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_trigger ON profiles;
CREATE TRIGGER protect_super_admin_trigger
BEFORE UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION protect_super_admin();

-- =====================================================
-- 7. Grant Permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- =====================================================
-- 8. Verification Queries
-- =====================================================

-- Check profiles table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

-- Check existing roles
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role;

-- Test RPC function (run as admin)
-- SELECT * FROM get_all_users_with_metadata();

COMMENT ON FUNCTION get_all_users_with_metadata() IS 'Returns all users with profiles and metadata - Admin only';
COMMENT ON FUNCTION sync_role_to_user_metadata() IS 'Syncs profile role to auth.users metadata (is_admin, is_moderator)';
COMMENT ON FUNCTION is_super_admin(uuid) IS 'Checks if user is the super admin based on email';
COMMENT ON FUNCTION protect_super_admin() IS 'Prevents super admin role changes';
