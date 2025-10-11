-- ============================================================================
-- CHECK COLUMN TYPES - Debug RPC Mismatch
-- ============================================================================

-- Check profiles table schema
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name IN ('username', 'email', 'avatar_url')
ORDER BY ordinal_position;

-- Check auth.users email type
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'auth'
  AND column_name = 'email'
ORDER BY ordinal_position;
