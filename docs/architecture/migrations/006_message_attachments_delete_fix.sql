-- ============================================
-- MIGRATION 006: Fix DELETE Policy for message_attachments
-- Purpose: Allow users to delete ANY attachment in their conversations
--          (not just attachments from messages they sent)
-- Created: 2025-10-18
-- ============================================

-- Drop the restrictive DELETE policy
DROP POLICY IF EXISTS "Users can delete their own attachments" ON message_attachments;

-- Create more permissive DELETE policy
-- Users can delete ANY attachment in conversations they are part of
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

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the new policy:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'message_attachments' AND cmd = 'DELETE';

-- Expected output:
-- policyname: "Users can delete attachments in their conversations"
-- cmd: DELETE

-- Test: Try deleting a received file (should work now)
-- DELETE FROM message_attachments WHERE id = 'received-file-id';
