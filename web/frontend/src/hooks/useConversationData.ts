/**
 * useConversationData Hook
 *
 * Handles data loading for conversations:
 * - Loading conversations with members
 * - Enriching with profiles and last messages
 * - Calculating unread counts
 * - Filtering by friends
 */

import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Conversation, ConversationMember, Profile } from './useConversations';

export function useConversationData(currentUserId: string | null) {
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    console.log('🔄 Loading conversations...');
    if (!currentUserId) return [];

    try {
      // 1. Get conversation memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at, is_pinned')
        .eq('user_id', currentUserId);

      if (membershipsError) throw membershipsError;

      const conversationIds = memberships?.map(m => m.conversation_id) || [];
      if (conversationIds.length === 0) {
        return [];
      }

      // 2. Get conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      // 3. Get all members for these conversations
      const { data: allMembers, error: membersError } = await supabase
        .from('conversation_members')
        .select('*')
        .in('conversation_id', conversationIds);

      if (membersError) throw membersError;

      console.log('👥 ALL Members from DB:', allMembers);
      console.log('👥 Total members count:', allMembers?.length);
      console.log('👥 Members per conversation:', conversationIds.map(convId => ({
        conversation_id: convId,
        members: allMembers?.filter(m => m.conversation_id === convId).map(m => m.user_id)
      })));

      // 4. Get profiles for all member user_ids
      const allUserIds = Array.from(new Set(allMembers?.map(m => m.user_id) || []));
      console.debug('User-IDs für Profile-Abfrage:', allUserIds);
      let profiles: Profile[] = [];
      if (allUserIds.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', allUserIds);
        if (error) {
          console.error('Fehler beim Laden der Profile:', error);
        }
        profiles = data || [];
        console.debug('Geladene Profile:', profiles);
      }

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // 4.5 Get friends
      const { data: friendsData } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'accepted');

      const friendIds = friendsData?.map(f => f.user_id === currentUserId ? f.friend_id : f.user_id) || [];
      console.log('👥 Friend IDs:', friendIds);
      console.log('📋 Friendships data:', friendsData);

      // 5. Get last message for each conversation
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, sender_id, created_at, message_type')
        .in('conversation_id', conversationIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      const lastMessageMap = new Map<string, {
        content: string;
        sender_id: string;
        created_at: string;
        message_type: string;
      }>();
      lastMessages?.forEach(msg => {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg);
        }
      });

      // 6. Get unread counts
      console.log('🔢 Calculating unread counts for memberships:', memberships?.length);

      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('conversation_id, created_at, sender_id')
        .in('conversation_id', conversationIds)
        .eq('is_deleted', false);

      console.log('📨 Found unread messages:', unreadMessages?.length);

      const unreadCountMap = new Map<string, number>();
      memberships?.forEach((membership: { conversation_id: string; last_read_at: string | null; is_pinned: boolean }) => {
        const count = unreadMessages?.filter((msg: { conversation_id: string; created_at: string; sender_id: string }) =>
          msg.conversation_id === membership.conversation_id &&
          msg.sender_id !== currentUserId && // Nur eingehende Nachrichten zählen
          (!membership.last_read_at || new Date(msg.created_at) > new Date(membership.last_read_at))
        ).length || 0;

        unreadCountMap.set(membership.conversation_id, count);
      });

      // 7. Enrich conversations with all data
      const enrichedConversations: Conversation[] = conversationsData?.map(conv => {
        const convMembers = allMembers?.filter((m: ConversationMember) => m.conversation_id === conv.id) || [];
        const currentMembership = memberships?.find((m: { conversation_id: string }) => m.conversation_id === conv.id);

        const members: ConversationMember[] = convMembers.map((m: ConversationMember) => {
          const profile = profilesMap.get(m.user_id);
          return {
            ...m,
            display_name: profile?.full_name || profile?.username || '',
            username: profile?.username
          };
        });

        const otherMember = members.find(m => m.user_id !== currentUserId);

        const result: Conversation & { other_user?: { id: string; full_name: string; username: string } } = {
          ...conv,
          members,
          lastMessage: lastMessageMap.get(conv.id),
          last_message: lastMessageMap.get(conv.id),
          isPinned: currentMembership?.is_pinned || false,
          currentUserId: currentUserId,
        };

        const unread = unreadCountMap.get(conv.id);
        if (unread && unread > 0) {
          result.unreadCount = unread;
          result.unread_count = unread;
        }

        if (conv.type === 'direct' && otherMember) {
          result.other_user = {
            id: otherMember.user_id,
            full_name: otherMember.display_name || 'Unknown',
            username: otherMember.username || 'unknown'
          };
        }

        return result;
      }) || [];

      // 8. Filter conversations to only show with friends
      const filteredConversations = enrichedConversations.filter(conv => {
        // Only direct chats with friends
        if (conv.type === 'direct' && conv.other_user && friendIds.includes(conv.other_user.id)) return true;
        return false;
      });

      console.log('🔍 Filtered conversations count:', filteredConversations.length);
      console.log('✅ Conversations loaded with unread counts:', filteredConversations.map(c => ({ id: c.id, unreadCount: c.unreadCount })));

      return filteredConversations;
    } catch (err) {
      console.error('Error loading conversations:', err);
      throw err;
    }
  }, [currentUserId]);

  return { loadConversations };
}
