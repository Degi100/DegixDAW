/**
 * messageService.ts
 *
 * Service layer for message-related API calls
 * Extracted from useMessages hook to separate business logic from UI logic
 */

import { supabase } from '../supabase';

/**
 * Send a new message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  currentUserId: string,
  content: string,
  messageType: 'text' | 'image' | 'video' | 'voice' | 'file' = 'text',
  replyToId?: string
): Promise<string> {
  const { data: message, error: sendError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      message_type: messageType,
      reply_to_id: replyToId || null,
    })
    .select()
    .single();

  if (sendError) throw sendError;

  // Update conversation's last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Create read receipt for sender
  await supabase
    .from('message_read_receipts')
    .insert({
      message_id: message.id,
      user_id: currentUserId,
      read_at: new Date().toISOString(),
    });

  return message.id;
}

/**
 * Edit an existing message
 */
export async function editMessage(messageId: string, newContent: string): Promise<void> {
  const { error: updateError } = await supabase
    .from('messages')
    .update({
      content: newContent,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (updateError) throw updateError;
}

/**
 * Soft-delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const { error: deleteError } = await supabase
    .from('messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      content: null,
    })
    .eq('id', messageId);

  if (deleteError) throw deleteError;
}

/**
 * Add a reaction to a message
 */
export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const { error: insertError } = await supabase
    .from('message_reactions')
    .insert({
      message_id: messageId,
      user_id: userId,
      emoji,
    });

  if (insertError) throw insertError;
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (deleteError) throw deleteError;
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<void> {
  // Check if read receipt exists
  const { data: existing } = await supabase
    .from('message_read_receipts')
    .select('id, read_at')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    if (!existing.read_at) {
      // Update to mark as read
      await supabase
        .from('message_read_receipts')
        .update({ read_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
  } else {
    // Create new read receipt
    await supabase
      .from('message_read_receipts')
      .insert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString(),
      });
  }
}

/**
 * Start typing indicator
 */
export async function startTypingIndicator(
  conversationId: string,
  userId: string
): Promise<void> {
  await supabase
    .from('typing_indicators')
    .upsert({
      conversation_id: conversationId,
      user_id: userId,
      started_at: new Date().toISOString(),
    }, {
      onConflict: 'conversation_id,user_id'
    });
}

/**
 * Stop typing indicator
 */
export async function stopTypingIndicator(
  conversationId: string,
  userId: string
): Promise<void> {
  await supabase
    .from('typing_indicators')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}
