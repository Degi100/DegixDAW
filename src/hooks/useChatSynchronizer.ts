import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Props for the useChatSynchronizer hook
 */
interface UseChatSynchronizerProps {
  currentUserId: string | null;
  isOpen: boolean;
  loadConversations: () => Promise<void>;
  playMessageReceived: () => void;
  expandedChatId?: string | null; // ID des aktuell geöffneten Chats
  markConversationAsRead?: (chatId: string) => Promise<void>; // Funktion zum Markieren als gelesen
}

// Definiere einen Typ für den erwarteten Supabase-Einfüge-Payload
interface SupabaseMessageInsertPayload {
  new: {
    conversation_id: string;
    sender_id: string;
  };
}

/**
 * Custom hook for global real-time chat synchronization
 *
 * Handles debounced conversation refreshing and global message subscriptions.
 *
 * @param props - Hook configuration
 * @returns Object containing synchronization handlers
 */
export function useChatSynchronizer({
  currentUserId,
  isOpen,
  loadConversations,
  playMessageReceived,
  expandedChatId,
  markConversationAsRead,
}: UseChatSynchronizerProps) {
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced refresh function to prevent too many updates
  const refreshConversations = useCallback(async () => {
    // Clear existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    // Set new timeout for debounced refresh
    const timeout = setTimeout(async () => {
      try {
        console.log('🔄 Refreshing conversations...');
        await loadConversations();
      } catch (error) {
        console.error('Error refreshing conversations:', error);
      }
    }, 300); // 300ms debounce

    setRefreshTimeout(timeout);
  }, [loadConversations, refreshTimeout]);

  // Centralized subscription for message inserts
  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    const channel = supabase
      .channel(`sidebar_global:${currentUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        try {
          const typedPayload = payload as unknown as SupabaseMessageInsertPayload;
          const messageConversationId = typedPayload.new?.conversation_id;
          const messageSenderId = typedPayload.new?.sender_id;
          
          console.log('📩 New global message received:', messageConversationId);
          
          // AUTO-READ: Wenn die Nachricht im aktuell geöffneten Chat ankommt
          // und nicht von mir selbst ist, markiere als gelesen
          if (expandedChatId && 
              messageConversationId === expandedChatId && 
              messageSenderId !== currentUserId &&
              markConversationAsRead) {
            console.log('✅ Auto-marking as read (chat is open):', expandedChatId);
            await markConversationAsRead(expandedChatId);
          } else {
            // Sonst normale Aktualisierung
            refreshConversations();
          }
          
          // Sound nur für Nachrichten von anderen abspielen
          if (messageSenderId !== currentUserId) {
            playMessageReceived();
          }
        } catch (error) {
          console.error("Error processing global message payload:", error);
          // swallow any shape errors
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, currentUserId, expandedChatId, markConversationAsRead, refreshConversations, playMessageReceived]);

  return {
    refreshConversations,
  };
}