-- ============================================
-- MIGRATION 007: Soft Delete for message_attachments
-- Purpose: Allow users to delete files "for themselves" without affecting the other user
-- Concept: Like WhatsApp "Delete for me" vs "Delete for everyone"
-- Created: 2025-10-18
-- ============================================

-- Add deleted_for column (array of user IDs who deleted this attachment)
ALTER TABLE message_attachments
ADD COLUMN IF NOT EXISTS deleted_for UUID[] DEFAULT '{}';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_message_attachments_deleted_for
  ON message_attachments USING GIN (deleted_for);

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON message_attachments;

-- New SELECT policy: Exclude attachments deleted by current user
CREATE POLICY "Users can view attachments in their conversations"
  ON message_attachments
  FOR SELECT
  TO authenticated
  USING (
    -- Must be in a conversation they're part of
    message_id IN (
      SELECT m.id
      FROM messages m
      INNER JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
    -- AND NOT deleted by current user
    AND NOT (auth.uid() = ANY(deleted_for))
  );

-- Drop old DELETE policy (we won't use hard deletes anymore)
DROP POLICY IF EXISTS "Users can delete their own attachments" ON message_attachments;
DROP POLICY IF EXISTS "Users can delete attachments in their conversations" ON message_attachments;

-- UPDATE policy: Allow users to add themselves to deleted_for array
DROP POLICY IF EXISTS "Users can update their own attachments" ON message_attachments;

CREATE POLICY "Users can soft-delete attachments in their conversations"
  ON message_attachments
  FOR UPDATE
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id
      FROM messages m
      INNER JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Only allow updating deleted_for column
    message_id IN (
      SELECT m.id
      FROM messages m
      INNER JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTION: Soft Delete
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_attachment(p_attachment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Add current user to deleted_for array (if not already there)
  UPDATE message_attachments
  SET deleted_for =
    CASE
      WHEN auth.uid() = ANY(deleted_for) THEN deleted_for
      ELSE array_append(deleted_for, auth.uid())
    END
  WHERE id = p_attachment_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CLEANUP FUNCTION: Hard delete when all users deleted
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_fully_deleted_attachments()
RETURNS void AS $$
BEGIN
  -- Find attachments where ALL conversation members deleted it
  DELETE FROM message_attachments ma
  WHERE (
    SELECT COUNT(DISTINCT cm.user_id)
    FROM messages m
    INNER JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE m.id = ma.message_id
  ) = (
    SELECT COUNT(*)
    FROM unnest(ma.deleted_for) AS user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check column was added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'message_attachments' AND column_name = 'deleted_for';

-- Check policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'message_attachments';

-- Test soft delete:
-- SELECT soft_delete_attachment('attachment-id', auth.uid());

-- ============================================
-- USAGE EXAMPLE
-- ============================================

/*
-- Frontend usage (replace DELETE with RPC call):

// Old (hard delete):
await supabase
  .from('message_attachments')
  .delete()
  .eq('id', fileId);

// New (soft delete):
await supabase.rpc('soft_delete_attachment', {
  p_attachment_id: fileId
});

// The function automatically uses auth.uid() so no need to pass user_id
*/

-- ============================================
-- NOTES
-- ============================================

-- 1. Attachments are soft-deleted (hidden from user who deleted)
-- 2. Other users still see the attachment
-- 3. When ALL users in conversation delete → can be hard-deleted (cleanup function)
-- 4. Storage files should be kept until hard delete
-- 5. Run cleanup_fully_deleted_attachments() periodically (cronjob)
