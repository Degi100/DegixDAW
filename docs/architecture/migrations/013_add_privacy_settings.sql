-- ============================================
-- MIGRATION 013: Add Privacy Settings
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "show_email": false,
  "show_bio": true,
  "show_instruments": true,
  "show_projects": true,
  "show_followers": true
}'::jsonb;

COMMENT ON COLUMN profiles.privacy_settings IS 'Privacy settings: show_email, show_bio, show_instruments, show_projects, show_followers';

CREATE INDEX IF NOT EXISTS idx_profiles_privacy_settings
  ON profiles USING GIN(privacy_settings);
