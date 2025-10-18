-- ============================================
-- MIGRATION 005: RLS Policies for message_attachments
-- Purpose: Allow users to delete their own chat attachments
-- Created: 2025-10-18
-- ============================================

-- Enable RLS on message_attachments table
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON message_attachments;
DROP POLICY IF EXISTS "Users can insert attachments in their conversations" ON message_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON message_attachments;
DROP POLICY IF EXISTS "Users can delete attachments in self-conversations" ON message_attachments;

-- ============================================
-- SELECT Policy
-- ============================================
-- Users can view attachments in conversations they are part of
CREATE POLICY "Users can view attachments in their conversations"
  ON message_attachments
  FOR SELECT
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id
      FROM messages m
      INNER JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- ============================================
-- INSERT Policy
-- ============================================
-- Users can insert attachments in their conversations
CREATE POLICY "Users can insert attachments in their conversations"
  ON message_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    message_id IN (
      SELECT m.id
      FROM messages m
      INNER JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- ============================================
-- DELETE Policy
-- ============================================
-- Users can delete attachments from messages THEY sent
CREATE POLICY "Users can delete their own attachments"
  ON message_attachments
  FOR DELETE
  TO authenticated
  USING (
    message_id IN (
      SELECT id
      FROM messages
      WHERE sender_id = auth.uid()
    )
  );

-- Alternative: Users can delete ANY attachment in their conversations
-- (Uncomment this and comment out the above if you want more permissive deletes)
/*
CREATE POLICY "Users can delete attachments in their conversations"
  ON message_attachments
  FOR DELETE
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id
      FROM messages m
      INNER JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  );
*/

-- ============================================
-- UPDATE Policy (optional)
-- ============================================
-- Users can update attachments they uploaded
-- (Not currently used, but included for completeness)
DROP POLICY IF EXISTS "Users can update their own attachments" ON message_attachments;

CREATE POLICY "Users can update their own attachments"
  ON message_attachments
  FOR UPDATE
  TO authenticated
  USING (
    message_id IN (
      SELECT id
      FROM messages
      WHERE sender_id = auth.uid()
    )
  )
  WITH CHECK (
    message_id IN (
      SELECT id
      FROM messages
      WHERE sender_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify RLS policies were created:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'message_attachments';

-- Test DELETE permission:
-- DELETE FROM message_attachments WHERE id = 'your-file-id';
