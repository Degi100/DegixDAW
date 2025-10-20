-- ============================================
-- MIGRATION 012: Add Artist Profile Fields
-- Adds artist_type and instruments to profiles
-- ============================================

-- Add artist_type enum
CREATE TYPE artist_type AS ENUM ('musician', 'producer', 'mixer', 'listener', 'other');

-- Add columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS artist_type artist_type DEFAULT 'listener',
ADD COLUMN IF NOT EXISTS instruments TEXT[] DEFAULT '{}';

-- Comments
COMMENT ON COLUMN profiles.artist_type IS 'Type of artist: musician, producer, mixer, listener, other';
COMMENT ON COLUMN profiles.instruments IS 'Array of instruments/skills: guitar, piano, bass, vocals, drums, synth, mixing, mastering, etc.';

-- Index for filtering by artist type
CREATE INDEX IF NOT EXISTS idx_profiles_artist_type
  ON profiles(artist_type);

-- Index for searching instruments (GIN for array search)
CREATE INDEX IF NOT EXISTS idx_profiles_instruments
  ON profiles USING GIN(instruments);

-- Verification Query
-- SELECT id, username, artist_type, instruments FROM profiles LIMIT 5;
