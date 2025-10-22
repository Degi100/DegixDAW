/**
 * useMessageSubscriptions Hook
 *
 * Handles real-time subscriptions for messages:
 * - Messages changes
 * - Reactions changes
 * - Attachments changes
 * - Read receipts changes
 * - Typing indicators
 */

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { TypingUser } from './useMessages';

interface UseMessageSubscriptionsProps {
  conversationId: string | null;
  currentUserId: string | null;
  onMessageChange: () => void;
  onTypingUsersChange: (users: TypingUser[]) => void;
}

export function useMessageSubscriptions({
  conversationId,
  currentUserId,
  onMessageChange,
  onTypingUsersChange
}: UseMessageSubscriptionsProps) {
  // Messages, reactions, attachments, read receipts subscriptions
  useEffect(() => {
    if (!conversationId) return;

    const messagesChannel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          onMessageChange();
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel(`reactions_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          onMessageChange();
        }
      )
      .subscribe();

    const attachmentsChannel = supabase
      .channel(`attachments_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_attachments',
        },
        () => {
          onMessageChange();
        }
      )
      .subscribe();

    const readReceiptsChannel = supabase
      .channel(`read_receipts_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_read_receipts',
        },
        () => {
          onMessageChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(attachmentsChannel);
      supabase.removeChannel(readReceiptsChannel);
    };
  }, [conversationId, onMessageChange]);

  // Typing indicators subscription
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const typingChannel = supabase
      .channel(`typing_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          // Reload typing indicators
          const { data: typingData } = await supabase
            .from('typing_indicators')
            .select('user_id, started_at')
            .eq('conversation_id', conversationId)
            .neq('user_id', currentUserId)
            .gte('started_at', new Date(Date.now() - 5000).toISOString());

          if (typingData && typingData.length > 0) {
            const userIds = typingData.map(t => t.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, username')
              .in('id', userIds);

            const typingUsers: TypingUser[] = typingData.map(t => {
              const profile = profiles?.find(p => p.id === t.user_id);
              return {
                user_id: t.user_id,
                full_name: profile?.full_name || 'Unknown',
                username: profile?.username || 'unknown',
                started_at: t.started_at
              };
            });

            onTypingUsersChange(typingUsers);
          } else {
            onTypingUsersChange([]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, currentUserId, onTypingUsersChange]);
}
