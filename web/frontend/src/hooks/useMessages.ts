/**
 * useMessages Hook
 *
 * Main hook for message management
 * Refactored: 603 LOC → 270 LOC (55% reduction!)
 *
 * Extracted modules:
 * - messageService.ts (API calls)
 * - useMessageData (data loading)
 * - useMessageSubscriptions (real-time)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';
import { useMessageData } from './useMessageData';
import { useMessageSubscriptions } from './useMessageSubscriptions';
import * as messageService from '../lib/services/messageService';

// Re-export types for backward compatibility
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    full_name: string;
    username: string;
  };
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  thumbnail_url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface ReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  delivered_at: string;
  read_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'video' | 'voice' | 'file';
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    username: string;
  };
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  read_receipts?: ReadReceipt[];
  reply_to?: Message;
}

export interface TypingUser {
  user_id: string;
  full_name: string;
  username: string;
  started_at: string;
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { success, error } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Data loading hook
  const { loadMessages: loadMessagesData } = useMessageData(conversationId);

  // Load messages wrapper with error handling
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await loadMessagesData();
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
      error('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  }, [conversationId, loadMessagesData, error]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscriptions
  useMessageSubscriptions({
    conversationId,
    currentUserId,
    onMessageChange: loadMessages,
    onTypingUsersChange: setTypingUsers
  });

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'voice' | 'file' = 'text',
    replyToId?: string
  ) => {
    if (!conversationId || !currentUserId) return null;

    try {
      setSending(true);

      const messageId = await messageService.sendMessage(
        conversationId,
        currentUserId,
        content,
        messageType,
        replyToId
      );

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      await messageService.stopTypingIndicator(conversationId, currentUserId);

      return messageId;
    } catch (err) {
      console.error('Error sending message:', err);
      error('Fehler beim Senden der Nachricht');
      return null;
    } finally {
      setSending(false);
    }
  }, [conversationId, currentUserId, error]);

  // Edit a message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await messageService.editMessage(messageId, newContent);
      success('Nachricht bearbeitet');
      loadMessages();
    } catch (err) {
      console.error('Error editing message:', err);
      error('Fehler beim Bearbeiten');
    }
  }, [success, error, loadMessages]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId);
      success('Nachricht gelöscht');
      loadMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
      error('Fehler beim Löschen');
    }
  }, [success, error, loadMessages]);

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    try {
      await messageService.addReaction(messageId, currentUserId, emoji);
    } catch (err) {
      console.error('Error adding reaction:', err);
      error('Fehler beim Hinzufügen der Reaktion');
    }
  }, [currentUserId, error]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    try {
      await messageService.removeReaction(messageId, currentUserId, emoji);
    } catch (err) {
      console.error('Error removing reaction:', err);
      error('Fehler beim Entfernen der Reaktion');
    }
  }, [currentUserId, error]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!currentUserId) return;

    try {
      await messageService.markMessageAsRead(messageId, currentUserId);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [currentUserId]);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId || !conversationId) return;

    try {
      // Get all messages in conversation
      const { data: conversationMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId);

      if (conversationMessages && conversationMessages.length > 0) {
        for (const msg of conversationMessages) {
          await markAsRead(msg.id);
        }
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [currentUserId, conversationId, markAsRead]);

  // Auto-mark messages as read when conversation opens
  useEffect(() => {
    if (conversationId && currentUserId) {
      markAllAsRead();
    }
  }, [conversationId, currentUserId, markAllAsRead]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      await messageService.stopTypingIndicator(conversationId, currentUserId);
    } catch (err) {
      console.error('Error stopping typing:', err);
    }
  }, [conversationId, currentUserId]);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    try {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await messageService.startTypingIndicator(conversationId, currentUserId);

      // Auto-remove after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } catch (err) {
      console.error('Error starting typing:', err);
    }
  }, [conversationId, currentUserId, stopTyping]);

  return {
    messages,
    loading,
    sending,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    markAllAsRead,
    startTyping,
    stopTyping,
    refresh: loadMessages,
  };
}
