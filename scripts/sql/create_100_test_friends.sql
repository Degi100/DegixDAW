-- Make existing auth users friends with admin
-- Admin User ID: 010b60b9-0ef1-4d4a-af3d-822792207dda
-- This script creates friendships with existing users from auth.users

DO $$
DECLARE
  admin_id UUID := '010b60b9-0ef1-4d4a-af3d-822792207dda';
  user_record RECORD;
  friendship_count INTEGER := 0;
  target_count INTEGER := 100;
BEGIN
  RAISE NOTICE '🚀 Creating friendships with existing users...';
  
  -- Loop through existing auth users (excluding admin)
  FOR user_record IN 
    SELECT id 
    FROM auth.users 
    WHERE id != admin_id 
    ORDER BY created_at DESC
    LIMIT target_count
  LOOP
    -- Create friendship with admin (accepted)
    INSERT INTO friendships (user_id, friend_id, status, requested_at, responded_at, created_at, updated_at)
    VALUES (
      admin_id,
      user_record.id,
      'accepted',
      NOW(),
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;
    
    friendship_count := friendship_count + 1;
    
    IF friendship_count % 10 = 0 THEN
      RAISE NOTICE '✅ Created % friendships...', friendship_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '🎉 Done! Created % friendships with admin!', friendship_count;
  
  IF friendship_count < target_count THEN
    RAISE NOTICE '⚠️  Only % users available (wanted %). Create more auth users first!', friendship_count, target_count;
  END IF;
END $$;

-- Show result
SELECT 
  COUNT(*) as total_friends,
  'Admin has this many friends' as description
FROM friendships 
WHERE user_id = '010b60b9-0ef1-4d4a-af3d-822792207dda' 
  AND status = 'accepted';
