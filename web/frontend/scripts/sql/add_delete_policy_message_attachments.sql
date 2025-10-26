-- ============================================
-- ADD DELETE POLICY FOR MESSAGE_ATTACHMENTS
-- Allow users to delete attachments in their conversations
-- ============================================

-- Create DELETE policy
CREATE POLICY "Users can delete attachments in their conversations"
ON message_attachments
FOR DELETE
TO authenticated
USING (
  message_id IN (
    SELECT m.id
    FROM messages m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE cm.user_id = auth.uid()
  )
);

-- Verify policy was created
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'message_attachments'
AND cmd = 'DELETE';
