-- ============================================
-- CHECK REPLICA IDENTITY FOR REALTIME
-- Verify replica identity settings for realtime tables
-- ============================================

-- Check replica identity for message_attachments
SELECT
  c.relname as table_name,
  c.relreplident as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('message_attachments', 'user_files', 'tracks');

-- Explanation of replica_identity values:
-- 'd' = default (only primary key)
-- 'f' = full (all columns) - NEEDED for DELETE events in Supabase Realtime!
-- 'i' = index
-- 'n' = nothing

-- If message_attachments is 'd', we need to change it to 'f' for DELETE events:
-- ALTER TABLE message_attachments REPLICA IDENTITY FULL;
