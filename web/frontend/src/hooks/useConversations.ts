/**
 * useConversations Hook
 *
 * Main hook for conversation management
 * Refactored: 604 LOC → 169 LOC (72% reduction!)
 *
 * Extracted modules:
 * - conversationService.ts (API calls)
 * - useConversationData (data loading)
 * - useConversationSubscriptions (real-time)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';
import { useConversationData } from './useConversationData';
import { useConversationSubscriptions } from './useConversationSubscriptions';
import * as conversationService from '../lib/services/conversationService';

// Re-export types for backward compatibility
export interface Profile {
  id: string;
  full_name: string;
  username: string;
}

export interface ConversationMember {
  id: string;
  user_id: string;
  conversation_id?: string; // für DB-Objekte
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  is_pinned: boolean;
  // Profile enrichment
  username: string | undefined;
  display_name: string | undefined; // optional, da Mapping undefined liefern kann
  avatar_url: string | undefined;
  is_online: boolean | undefined;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  is_archived: boolean;
  // Computed fields
  members?: ConversationMember[];
  lastMessage?: {
    content: string;
    sender_id: string;
    created_at: string;
    message_type: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
    message_type: string;
  };
  unreadCount?: number;
  unread_count?: number;
  isPinned?: boolean;
  currentUserId?: string;
  other_user?: {
    id: string;
    full_name: string;
    username: string;
  };
}



export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { success, error } = useToast();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Data loading hook
  const { loadConversations: loadConversationsData } = useConversationData(currentUserId);

  // Load conversations wrapper with error handling
  const loadConversations = useCallback(async () => {
    try {
      const data = await loadConversationsData();
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setErrorState((err as Error)?.message || 'Fehler beim Laden der Chats');
      error('Fehler beim Laden der Chats');
    }
  }, [loadConversationsData, error]);

  // Initial load
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId, loadConversations]);

  // Real-time subscriptions
  useConversationSubscriptions({
    currentUserId,
    onConversationChange: loadConversations
  });

  // Optimistically mark as read (UI only, no server)
  const optimisticallyMarkAsRead = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0, unread_count: 0 }
          : conv
      )
    );
  }, []);

  // Create direct conversation
  const createDirectConversation = useCallback(async (otherUserId: string) => {
    // Get current user (fresh, not from state)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const conversationId = await conversationService.createDirectConversation(user.id, otherUserId);
      success('Chat erstellt! 💬');
      loadConversations();
      return conversationId;
    } catch (err) {
      console.error('Error creating conversation:', err);
      error('Fehler beim Erstellen des Chats');
      return null;
    }
  }, [success, error, loadConversations]);

  // Create group conversation
  const createGroupConversation = useCallback(async (
    name: string,
    memberIds: string[],
    description?: string
  ) => {
    if (!currentUserId) return null;

    try {
      const conversationId = await conversationService.createGroupConversation(
        currentUserId,
        name,
        memberIds,
        description
      );
      success('Gruppe erstellt! 🎉');
      loadConversations();
      return conversationId;
    } catch (err) {
      console.error('Error creating group:', err);
      error('Fehler beim Erstellen der Gruppe');
      return null;
    }
  }, [currentUserId, success, error, loadConversations]);

  // Update conversation
  const updateConversation = useCallback(async (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    try {
      await conversationService.updateConversation(conversationId, updates);
      success('Chat aktualisiert');
      loadConversations();
    } catch (err) {
      console.error('Error updating conversation:', err);
      error('Fehler beim Aktualisieren');
    }
  }, [success, error, loadConversations]);

  // Leave conversation
  const leaveConversation = useCallback(async (conversationId: string) => {
    if (!currentUserId) return;

    try {
      await conversationService.leaveConversation(conversationId, currentUserId);
      success('Chat verlassen');
      loadConversations();
    } catch (err) {
      console.error('Error leaving conversation:', err);
      error('Fehler beim Verlassen');
    }
  }, [currentUserId, success, error, loadConversations]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!currentUserId) return;

    try {
      await conversationService.markConversationAsRead(conversationId, currentUserId);

      // Update local state
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === conversationId) {
            const newConv = { ...conv };
            delete newConv.unreadCount;
            delete newConv.unread_count;
            return newConv;
          }
          return conv;
        })
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [currentUserId]);

  // Find or create direct conversation with a user
  const createOrOpenDirectConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    // Get current user (fresh, not from state)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      const conversationId = await conversationService.findOrCreateDirectConversation(user.id, otherUserId);
      return conversationId;
    } catch (err) {
      console.error('Error finding/creating conversation:', err);
      error('Fehler beim Öffnen des Chats');
      return null;
    }
  }, [error]);

  return {
    conversations,
    error: errorState,
    loadConversations,
    createDirectConversation,
    createGroupConversation,
    createOrOpenDirectConversation,
    updateConversation,
    leaveConversation,
    markAsRead,
    optimisticallyMarkAsRead,
    refresh: loadConversations,
  };
}
