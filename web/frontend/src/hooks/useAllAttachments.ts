// ============================================
// ALL ATTACHMENTS HOOK
// Fetch and filter chat attachments for FileBrowser
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';
import { getSignedUrl } from './useSignedUrl';

export interface AttachmentItem {
  id: string;
  messageId: string;
  conversationId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string; // storage path
  signedUrl: string | undefined; // signed URL for display
  thumbnailUrl: string | undefined;
  signedThumbnailUrl: string | undefined;
  width: number | null | undefined;
  height: number | null | undefined;
  duration: number | null | undefined;
  createdAt: string;
  // Message info
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  messageContent: string | null | undefined;
}

export type FileTypeFilter = 'all' | 'images' | 'videos' | 'audio' | 'documents';
export type FileBrowserTab = 'all' | 'received' | 'sent' | 'my_files';

interface UseAllAttachmentsOptions {
  userId: string;
  autoRefresh?: boolean;
}

export function useAllAttachments({ userId, autoRefresh = true }: UseAllAttachmentsOptions) {
  const [allAttachments, setAllAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  // ============================================
  // FETCH ALL ATTACHMENTS
  // ============================================
  const fetchAttachments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      // 1. Fetch all message_attachments with basic message info
      const { data: attachments, error: attachmentsError } = await supabase
        .from('message_attachments')
        .select(`
          id,
          message_id,
          file_url,
          file_name,
          file_type,
          file_size,
          thumbnail_url,
          width,
          height,
          duration,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (attachmentsError) throw attachmentsError;
      if (!attachments || attachments.length === 0) {
        setAllAttachments([]);
        return;
      }

      // 2. Get all message IDs
      const messageIds = attachments.map(att => att.message_id);

      // 3. Fetch messages with conversation info
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, sender_id, conversation_id')
        .in('id', messageIds);

      if (messagesError) throw messagesError;

      // Create message lookup map
      const messageMap = new Map(messages?.map(m => [m.id, m]) || []);

      // 4. Get all unique conversation IDs
      const conversationIds = [...new Set(messages?.map(m => m.conversation_id) || [])];

      // 5. Fetch conversation_members to check if user is participant
      const { data: memberships, error: membershipsError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId)
        .in('conversation_id', conversationIds);

      if (membershipsError) throw membershipsError;

      // Create set of conversation IDs where user is member
      const userConversationIds = new Set(memberships?.map(m => m.conversation_id) || []);

      // 6. Filter: only conversations where user is participant
      const userAttachments = attachments.filter(att => {
        const msg = messageMap.get(att.message_id);
        if (!msg) return false;
        return userConversationIds.has(msg.conversation_id);
      });

      // 7. Get all members for user's conversations to find recipients
      const { data: allConvMembers, error: convMembersError } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id')
        .in('conversation_id', Array.from(userConversationIds));

      if (convMembersError) throw convMembersError;

      // Create map: conversation_id -> array of user_ids
      const convMembersMap = new Map<string, string[]>();
      allConvMembers?.forEach(m => {
        const existing = convMembersMap.get(m.conversation_id) || [];
        convMembersMap.set(m.conversation_id, [...existing, m.user_id]);
      });

      // 8. Get all unique user IDs (senders and all conversation members)
      const userIds = new Set<string>();
      userAttachments.forEach(att => {
        const msg = messageMap.get(att.message_id);
        if (msg) {
          userIds.add(msg.sender_id);
          // Add all members of this conversation
          const members = convMembersMap.get(msg.conversation_id) || [];
          members.forEach(uid => userIds.add(uid));
        }
      });

      // 8. Fetch profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Create profile lookup map
      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      // 9. Map to AttachmentItem format with signed URLs
      const items: AttachmentItem[] = await Promise.all(
        userAttachments.map(async (att) => {
          const msg = messageMap.get(att.message_id);
          const senderId = msg?.sender_id || '';

          // Find recipient: the "other" user in the conversation
          // For self-conversation: sender === recipient === userId
          const convMembers = msg ? convMembersMap.get(msg.conversation_id) || [] : [];
          let recipientId = senderId; // default: self-conversation

          if (convMembers.length === 1) {
            // Self-conversation: only 1 member
            recipientId = convMembers[0];
          } else if (convMembers.length === 2) {
            // Normal conversation: 2 members, find the other one
            recipientId = convMembers.find(uid => uid !== senderId) || senderId;
          }

          const [signedUrl, signedThumbnailUrl] = await Promise.all([
            getSignedUrl(att.file_url),
            att.thumbnail_url ? getSignedUrl(att.thumbnail_url) : Promise.resolve(undefined),
          ]);

          return {
            id: att.id,
            messageId: att.message_id,
            conversationId: msg?.conversation_id || '',
            fileName: att.file_name,
            fileType: att.file_type,
            fileSize: att.file_size,
            fileUrl: att.file_url,
            signedUrl: signedUrl || undefined,
            thumbnailUrl: att.thumbnail_url || undefined,
            signedThumbnailUrl: signedThumbnailUrl || undefined,
            width: att.width,
            height: att.height,
            duration: att.duration,
            createdAt: att.created_at,
            senderId,
            senderName: profileMap.get(senderId) || 'Unknown',
            recipientId,
            recipientName: profileMap.get(recipientId) || 'Unknown',
            messageContent: msg?.content || null,
          };
        })
      );

      setAllAttachments(items);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      showError('Fehler beim Laden der Dateien');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [userId, showError]);

  // ============================================
  // FILTER BY TAB
  // ============================================
  const filterByTab = useCallback((tab: FileBrowserTab): AttachmentItem[] => {
    switch (tab) {
      case 'all':
        return allAttachments;

      case 'received':
        // Files received from OTHERS (not self-conversation)
        return allAttachments.filter(
          att => att.recipientId === userId && att.senderId !== userId
        );

      case 'sent':
        // Files sent to OTHERS (not self-conversation)
        return allAttachments.filter(
          att => att.senderId === userId && att.recipientId !== userId
        );

      case 'my_files':
        // Files in self-conversation (sender === recipient === userId)
        return allAttachments.filter(
          att => att.senderId === userId && att.recipientId === userId
        );

      default:
        return allAttachments;
    }
  }, [allAttachments, userId]);

  // ============================================
  // FILTER BY FILE TYPE
  // ============================================
  const filterByType = useCallback((items: AttachmentItem[], type: FileTypeFilter): AttachmentItem[] => {
    switch (type) {
      case 'images':
        return items.filter(att => att.fileType.startsWith('image/'));
      case 'videos':
        return items.filter(att => att.fileType.startsWith('video/'));
      case 'audio':
        return items.filter(att => att.fileType.startsWith('audio/'));
      case 'documents':
        return items.filter(
          att =>
            !att.fileType.startsWith('image/') &&
            !att.fileType.startsWith('video/') &&
            !att.fileType.startsWith('audio/')
        );
      case 'all':
      default:
        return items;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================
  useEffect(() => {
    if (!autoRefresh) return;

    const channel = supabase
      .channel('message_attachments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_attachments',
        },
        (payload) => {
          // For DELETE events, remove from state
          if (payload.eventType === 'DELETE' && payload.old) {
            setAllAttachments(prev => prev.filter(att => att.id !== (payload.old as any).id));
          } else {
            // For INSERT/UPDATE, silent background refresh
            fetchAttachments(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoRefresh, fetchAttachments]);

  return {
    allAttachments,
    loading,
    refresh: fetchAttachments,
    filterByTab,
    filterByType,
  };
}
