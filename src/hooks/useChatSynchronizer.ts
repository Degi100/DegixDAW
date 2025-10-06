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
      }, (payload) => {
        try {
          const typedPayload = payload as unknown as SupabaseMessageInsertPayload; // Typisierung korrigiert
          console.log('New global message received:', typedPayload.new?.conversation_id);
          refreshConversations();
          
          if (typedPayload.new?.sender_id !== currentUserId) {
            playMessageReceived();
          }
        } catch (error) {
          console.error("Error processing global message payload:", error);
          // swallow any shape errors
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, currentUserId, refreshConversations, playMessageReceived]);

  return {
    refreshConversations,
  };
}