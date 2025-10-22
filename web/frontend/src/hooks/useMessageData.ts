/**
 * useMessageData Hook
 *
 * Handles data loading for messages:
 * - Loading messages with enrichment
 * - Fetching profiles, reactions, attachments, read receipts
 */

import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Message, MessageReaction, MessageAttachment, ReadReceipt } from './useMessages';

interface Profile {
  id: string;
  full_name: string;
  username: string;
}

export function useMessageData(conversationId: string | null) {
  const loadMessages = useCallback(async (): Promise<Message[]> => {
    if (!conversationId) {
      return [];
    }

    try {
      // 1. Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        return [];
      }

      const messageIds = messagesData.map(m => m.id);

      // 2. Get all sender profiles
      const senderIds = Array.from(new Set(messagesData.map(m => m.sender_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', senderIds);

      const profilesMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);

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

      return enrichedMessages;
    } catch (err) {
      console.error('Error loading messages:', err);
      throw err;
    }
  }, [conversationId]);

  return { loadMessages };
}
