// Typ für Profile
export interface Profile {
  id: string;
  full_name: string;
  username: string;
}
// src/hooks/useConversations.ts
// Conversation Management Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

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

  // Optimistisches Markieren als gelesen (nur UI, kein Server)
  const optimisticallyMarkAsRead = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0, unread_count: 0 }
          : conv
      )
    );
  }, []);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    console.log('🔄 Loading conversations...');
    if (!currentUserId) return;

    try {
      // 1. Get conversation memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at, is_pinned')
        .eq('user_id', currentUserId);

      if (membershipsError) throw membershipsError;

      const conversationIds = memberships?.map(m => m.conversation_id) || [];
      if (conversationIds.length === 0) {
        setConversations([]);
        return;
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
      setConversations(filteredConversations);
      console.log('✅ Conversations loaded with unread counts:', filteredConversations.map(c => ({ id: c.id, unreadCount: c.unreadCount })));
    } catch (err) {
      console.error('Error loading conversations:', err);
      setErrorState((err as Error)?.message || 'Fehler beim Laden der Chats');
      error('Fehler beim Laden der Chats');
    }
  }, [currentUserId, error]);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId, loadConversations]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUserId) return;

    console.log('🎧 Setting up realtime subscriptions for user:', currentUserId);

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
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversations channel status:', status);
      });

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
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('📡 Members channel status:', status);
      });

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
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages channel status:', status);
      });

    return () => {
      console.log('🔌 Removing realtime subscriptions');
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, loadConversations]);

  // Create a new direct conversation
  const createDirectConversation = useCallback(async (otherUserId: string) => {
    // Get current user (fresh, not from state)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const userId = user.id;

    try {
      // Check if conversation already exists
      const { data: existingMemberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (existingMemberships) {
        for (const membership of existingMemberships) {
          const { data: otherMembership } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('conversation_id', membership.conversation_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherMembership) {
            // Conversation already exists
            return membership.conversation_id;
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: userId,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both members
      const { error: member1Error } = await supabase
        .from('conversation_members')
        .upsert(
          {
            conversation_id: conversation.id,
            user_id: userId,
            role: 'admin',
          },
          { onConflict: 'conversation_id,user_id' }
        );

      if (member1Error) throw member1Error;

      const { error: member2Error } = await supabase
        .from('conversation_members')
        .upsert(
          {
            conversation_id: conversation.id,
            user_id: otherUserId,
            role: 'member',
          },
          { onConflict: 'conversation_id,user_id' }
        );

      if (member2Error) throw member2Error;

      success('Chat erstellt! 💬');
      loadConversations();
      return conversation.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      error('Fehler beim Erstellen des Chats');
      return null;
    }
  }, [success, error, loadConversations]);

  // Create a group conversation
  const createGroupConversation = useCallback(async (
    name: string,
    memberIds: string[],
    description?: string
  ) => {
    if (!currentUserId) return null;

    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name,
          description: description || null,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add creator as admin
      const members = [
        {
          conversation_id: conversation.id,
          user_id: currentUserId,
          role: 'admin',
        },
        ...memberIds.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: 'member',
        })),
      ];

      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(members);

      if (membersError) throw membersError;

      success('Gruppe erstellt! 🎉');
      loadConversations();
      return conversation.id;
    } catch (err) {
      console.error('Error creating group:', err);
      error('Fehler beim Erstellen der Gruppe');
      return null;
    }
  }, [currentUserId, success, error, loadConversations]);

  // Update conversation (name, description, etc.)
  const updateConversation = useCallback(async (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId);

      if (updateError) throw updateError;

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
      const { error: deleteError } = await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      if (deleteError) throw deleteError;

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
      const { error: updateError } = await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      if (updateError) throw updateError;

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

    const userId = user.id;

    try {
      // Get my direct conversations
      const { data: myConvs } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', userId);

      if (myConvs) {
        const directConvIds = myConvs
          .filter((m: any) => m.conversations.type === 'direct')
          .map((m: any) => m.conversation_id);

        // For each direct conversation, check if BOTH users are members
        for (const convId of directConvIds) {
          const { count } = await supabase
            .from('conversation_members')
            .select('user_id', { count: 'exact' })
            .eq('conversation_id', convId)
            .in('user_id', [userId, otherUserId]);

          // If both users are members (count === 2), this is the conversation!
          if (count === 2) {
            return convId;
          }
        }
      }

      // No existing conversation found, create new one
      const conversationId = await createDirectConversation(otherUserId);
      return conversationId;
    } catch (err) {
      console.error('Error finding/creating conversation:', err);
      error('Fehler beim Öffnen des Chats');
      return null;
    }
  }, [createDirectConversation, error]);

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
