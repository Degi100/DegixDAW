-- Claude creates a test issue
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xcdzugnjzrkngzmtzeip/sql

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find admin user by username OR role (profiles has NO email column!)
  SELECT user_id INTO admin_user_id
  FROM profiles
  WHERE username ILIKE '%rdegi%' OR role = 'admin'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found! Check your username in profiles table.';
  END IF;

  -- Create test issue
  INSERT INTO issues (
    title,
    description,
    priority,
    category,
    labels,
    status,
    created_by,
    metadata
  ) VALUES (
    '🤖 Test Issue created by Claude',
    E'This is a test issue created directly by Claude AI.\n\n**Purpose:** Testing Claude ↔ Issues Integration\n\n**Next Steps:**\n- Verify issue appears in Admin Panel\n- Test Claude can read this issue\n- Test Claude can update/comment on it\n\n**Technical Details:**\n- Created via: Direct SQL Insert\n- Created by: Claude AI\n- Timestamp: ' || NOW()::TEXT,
    'high',
    'Testing',
    ARRAY['feature', 'urgent'],
    'open',
    admin_user_id,
    '{"created_by_ai": true, "ai_name": "Claude"}'::jsonb
  );

  RAISE NOTICE '✅ Test issue created successfully!';
  RAISE NOTICE '🌐 View at: http://localhost:5173/admin/issues';
END $$;
