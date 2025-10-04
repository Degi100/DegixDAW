// src/hooks/useMessages.ts
// Messages Management Hook with Reactions, Read Receipts, Typing Indicators

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

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
  // Enriched data
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

  // Load messages for a conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const messageIds = messagesData.map(m => m.id);

      // 2. Get all sender profiles
      const senderIds = Array.from(new Set(messagesData.map(m => m.sender_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', senderIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // 3. Get reactions
      const { data: reactions } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      const reactionsMap = new Map<string, MessageReaction[]>();
      reactions?.forEach(r => {
        if (!reactionsMap.has(r.message_id)) {
          reactionsMap.set(r.message_id, []);
        }
        reactionsMap.get(r.message_id)?.push({
          ...r,
          user: profilesMap.get(r.user_id)
        });
      });

      // 4. Get attachments
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);

      const attachmentsMap = new Map<string, MessageAttachment[]>();
      attachments?.forEach(a => {
        if (!attachmentsMap.has(a.message_id)) {
          attachmentsMap.set(a.message_id, []);
        }
        attachmentsMap.get(a.message_id)?.push(a);
      });

      // 5. Get read receipts
      const { data: readReceipts } = await supabase
        .from('message_read_receipts')
        .select('*')
        .in('message_id', messageIds);

      const readReceiptsMap = new Map<string, ReadReceipt[]>();
      readReceipts?.forEach(rr => {
        if (!readReceiptsMap.has(rr.message_id)) {
          readReceiptsMap.set(rr.message_id, []);
        }
        readReceiptsMap.get(rr.message_id)?.push(rr);
      });

      // 6. Enrich messages
      const enrichedMessages: Message[] = messagesData.map(msg => ({
        ...msg,
        sender: profilesMap.get(msg.sender_id),
        reactions: reactionsMap.get(msg.id) || [],
        attachments: attachmentsMap.get(msg.id) || [],
        read_receipts: readReceiptsMap.get(msg.id) || []
      }));

      setMessages(enrichedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      error('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  }, [conversationId, error]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscriptions
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
          loadMessages();
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
          loadMessages();
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
          loadMessages();
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
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(attachmentsChannel);
      supabase.removeChannel(readReceiptsChannel);
    };
  }, [conversationId, loadMessages]);

  // Typing indicators subscription
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const loadTypingUsers = async () => {
      const { data: typingData } = await supabase
        .from('typing_indicators')
        .select('user_id, started_at')
        .eq('conversation_id', conversationId)
        .neq('user_id', currentUserId);

      if (typingData && typingData.length > 0) {
        const userIds = typingData.map(t => t.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const enrichedTyping = typingData
          .map(t => {
            const profile = profilesMap.get(t.user_id);
            return profile ? {
              user_id: t.user_id,
              full_name: profile.full_name,
              username: profile.username,
              started_at: t.started_at
            } : null;
          })
          .filter((t): t is TypingUser => t !== null);

        setTypingUsers(enrichedTyping);
      } else {
        setTypingUsers([]);
      }
    };

    loadTypingUsers();

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
        () => {
          loadTypingUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, currentUserId]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'voice' | 'file' = 'text',
    replyToId?: string
  ) => {
    if (!conversationId || !currentUserId) return null;

    try {
      setSending(true);

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

      // Stop typing indicator (inline to avoid circular dependency)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      return message.id;
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
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (updateError) throw updateError;

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
      const { error: deleteError } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          content: null,
        })
        .eq('id', messageId);

      if (deleteError) throw deleteError;

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
      const { error: insertError } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji,
        });

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Error adding reaction:', err);
      error('Fehler beim Hinzufügen der Reaktion');
    }
  }, [currentUserId, error]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    try {
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error removing reaction:', err);
      error('Fehler beim Entfernen der Reaktion');
    }
  }, [currentUserId, error]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!currentUserId) return;

    try {
      // Check if read receipt exists
      const { data: existing } = await supabase
        .from('message_read_receipts')
        .select('id, read_at')
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
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
            user_id: currentUserId,
            read_at: new Date().toISOString(),
          });
      }
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

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
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

      // Upsert typing indicator
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: currentUserId,
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'conversation_id,user_id'
        });

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
