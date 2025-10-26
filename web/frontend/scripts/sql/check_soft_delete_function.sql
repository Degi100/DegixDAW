-- ============================================
-- CHECK SOFT DELETE FUNCTION
-- View the soft_delete_attachment RPC function
-- ============================================

-- Get function definition
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'soft_delete_attachment';

-- Check if there's a deleted_attachments table or similar
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%delete%';

-- Check if message_attachments has a deleted/soft_delete column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'message_attachments'
AND table_schema = 'public'
ORDER BY ordinal_position;
