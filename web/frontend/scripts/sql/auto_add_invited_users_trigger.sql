-- ============================================
-- Database Trigger: Auto-Add Invited Users After Signup
-- When a user signs up, check if they have pending invitations
-- and automatically add them to those projects
-- ============================================

CREATE OR REPLACE FUNCTION auto_add_invited_users()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new profile is created (after user signup)
  -- Check for pending invitations matching this user's email

  INSERT INTO project_collaborators (
    project_id,
    user_id,
    role,
    can_edit,
    can_download,
    can_upload_audio,
    can_upload_mixdown,
    can_comment,
    can_invite_others,
    invited_by,
    invited_at,
    accepted_at
  )
  SELECT
    pi.project_id,
    NEW.id, -- The new user's ID
    pi.role::text,
    (pi.permissions->>'can_edit')::boolean,
    (pi.permissions->>'can_download')::boolean,
    (pi.permissions->>'can_upload_audio')::boolean,
    (pi.permissions->>'can_upload_mixdown')::boolean,
    (pi.permissions->>'can_comment')::boolean,
    (pi.permissions->>'can_invite_others')::boolean,
    pi.invited_by,
    pi.invited_at,
    NOW() -- Auto-accepted
  FROM pending_email_invitations pi
  INNER JOIN auth.users au ON LOWER(au.email) = LOWER(pi.email)
  WHERE au.id = NEW.id
  AND pi.status = 'pending'
  ON CONFLICT (project_id, user_id) DO NOTHING; -- Skip if already added

  -- Mark invitations as accepted
  UPDATE pending_email_invitations
  SET status = 'accepted'
  WHERE email IN (
    SELECT LOWER(email) FROM auth.users WHERE id = NEW.id
  )
  AND status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table (after INSERT)
DROP TRIGGER IF EXISTS trigger_auto_add_invited_users ON profiles;

CREATE TRIGGER trigger_auto_add_invited_users
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_invited_users();

COMMENT ON FUNCTION auto_add_invited_users IS 'Automatically adds users to projects they were invited to via email';
