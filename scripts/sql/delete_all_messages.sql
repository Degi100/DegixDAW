-- Delete all messages from the database
-- This will give us a clean slate for testing the badge system

-- First delete all message attachments
DELETE FROM public.message_attachments;

-- Then delete all messages
DELETE FROM public.messages;

-- Reset last_read_at for all conversation members (optional - for clean test)
UPDATE public.conversation_members SET last_read_at = NULL;

-- Verify deletion
SELECT 'Messages remaining:' as status, COUNT(*) as count FROM public.messages;
SELECT 'Attachments remaining:' as status, COUNT(*) as count FROM public.message_attachments;
SELECT 'Conversation members reset:' as status, COUNT(*) as count FROM public.conversation_members WHERE last_read_at IS NULL;
