-- ============================================
-- MIGRATION 010: Add avatar_url to profiles
-- SAFE: Only adds optional column, no breaking changes
-- ============================================

-- Add avatar_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.avatar_url IS 'Storage path to user avatar image: avatars/{user_id}/{filename}';

-- Index for faster avatar queries (optional, but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- Verification Query (run after migration)
-- SELECT id, username, avatar_url FROM profiles LIMIT 5;
