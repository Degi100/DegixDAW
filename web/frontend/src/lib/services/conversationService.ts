/**
 * conversationService.ts
 *
 * Service layer for conversation-related API calls
 * Extracted from useConversations hook to separate business logic from UI logic
 */

import { supabase } from '../supabase';
import type { Conversation } from '../../hooks/useConversations';

/**
 * Create a new direct conversation between two users
 * Returns existing conversation ID if conversation already exists
 */
export async function createDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string | null> {
  try {
    // Check if conversation already exists
    const { data: existingMemberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (existingMemberships) {
      for (const membership of existingMemberships) {
        const { data: otherMembership } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('conversation_id', membership.conversation_id)
          .eq('user_id', otherUserId)
          .single();

        if (otherMembership) {
          // Conversation already exists
          return membership.conversation_id;
        }
      }
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'direct',
        created_by: currentUserId,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add both members
    const { error: member1Error } = await supabase
      .from('conversation_members')
      .upsert(
        {
          conversation_id: conversation.id,
          user_id: currentUserId,
          role: 'admin',
        },
        { onConflict: 'conversation_id,user_id' }
      );

    if (member1Error) throw member1Error;

    const { error: member2Error } = await supabase
      .from('conversation_members')
      .upsert(
        {
          conversation_id: conversation.id,
          user_id: otherUserId,
          role: 'member',
        },
        { onConflict: 'conversation_id,user_id' }
      );

    if (member2Error) throw member2Error;

    return conversation.id;
  } catch (err) {
    console.error('Error creating conversation:', err);
    throw err;
  }
}

/**
 * Create a new group conversation
 */
export async function createGroupConversation(
  currentUserId: string,
  name: string,
  memberIds: string[],
  description?: string
): Promise<string | null> {
  try {
    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'group',
        name,
        description: description || null,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add creator as admin
    const members = [
      {
        conversation_id: conversation.id,
        user_id: currentUserId,
        role: 'admin',
      },
      ...memberIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        role: 'member',
      })),
    ];

    const { error: membersError } = await supabase
      .from('conversation_members')
      .insert(members);

    if (membersError) throw membersError;

    return conversation.id;
  } catch (err) {
    console.error('Error creating group:', err);
    throw err;
  }
}

/**
 * Update conversation metadata (name, description, etc.)
 */
export async function updateConversation(
  conversationId: string,
  updates: Partial<Conversation>
): Promise<void> {
  const { error: updateError } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId);

  if (updateError) throw updateError;
}

/**
 * Leave a conversation (remove current user from members)
 */
export async function leaveConversation(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('conversation_members')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId);

  if (deleteError) throw deleteError;
}

/**
 * Mark conversation as read (update last_read_at timestamp)
 */
export async function markConversationAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId);

  if (updateError) throw updateError;
}

/**
 * Find or create direct conversation with a user
 * Returns existing conversation ID if found, creates new one otherwise
 */
export async function findOrCreateDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string | null> {
  try {
    // Get my direct conversations
    const { data: myConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations!inner(type)')
      .eq('user_id', currentUserId);

    if (myConvs) {
      const directConvIds = myConvs
        .filter((m: any) => m.conversations.type === 'direct')
        .map((m: any) => m.conversation_id);

      // For each direct conversation, check if BOTH users are members
      for (const convId of directConvIds) {
        const { count } = await supabase
          .from('conversation_members')
          .select('user_id', { count: 'exact' })
          .eq('conversation_id', convId)
          .in('user_id', [currentUserId, otherUserId]);

        // If both users are members (count === 2), this is the conversation!
        if (count === 2) {
          return convId;
        }
      }
    }

    // No existing conversation found, create new one
    return await createDirectConversation(currentUserId, otherUserId);
  } catch (err) {
    console.error('Error finding/creating conversation:', err);
    throw err;
  }
}
