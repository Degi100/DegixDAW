/**
 * useConversationSubscriptions Hook
 *
 * Handles real-time subscriptions for conversations:
 * - Conversations changes
 * - Conversation members changes
 * - New messages
 */

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseConversationSubscriptionsProps {
  currentUserId: string | null;
  onConversationChange: () => void;
}

export function useConversationSubscriptions({
  currentUserId,
  onConversationChange
}: UseConversationSubscriptionsProps) {
  useEffect(() => {
    if (!currentUserId) return;

    console.log('🎧 Setting up realtime subscriptions for user:', currentUserId);

    // Subscribe to conversations changes
    const conversationsChannel = supabase
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('🔔 Conversation changed:', payload);
          onConversationChange();
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversations channel status:', status);
      });

    // Subscribe to conversation_members changes
    const membersChannel = supabase
      .channel('conversation_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('🔔 Member changed:', payload);
          onConversationChange();
        }
      )
      .subscribe((status) => {
        console.log('📡 Members channel status:', status);
      });

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages_changes_for_list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🔔 New message received, reloading conversations:', payload);
          onConversationChange();
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages channel status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Removing realtime subscriptions');
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, onConversationChange]);
}
