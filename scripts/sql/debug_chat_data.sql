-- ============================================
-- DEBUG: Check Chat Data
-- ============================================

-- 1. Zeige alle Conversations
SELECT 
  c.id,
  c.type,
  c.created_by,
  c.created_at,
  u.email as creator_email
FROM conversations c
LEFT JOIN auth.users u ON u.id = c.created_by
ORDER BY c.created_at DESC
LIMIT 10;

-- 2. Zeige alle Conversation Members
SELECT 
  cm.id,
  cm.conversation_id,
  cm.user_id,
  cm.role,
  u.email as user_email,
  p.username,
  p.full_name
FROM conversation_members cm
LEFT JOIN auth.users u ON u.id = cm.user_id
LEFT JOIN profiles p ON p.id = cm.user_id
ORDER BY cm.joined_at DESC
LIMIT 20;

-- 3. Zeige alle Profiles
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.is_online,
  u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 20;

-- 4. Check: Gibt es Users OHNE Profile?
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ MISSING'
    ELSE '✅ EXISTS'
  END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC;
