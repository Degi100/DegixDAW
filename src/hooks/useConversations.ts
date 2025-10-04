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
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  is_pinned: boolean;
  // Profile enrichment
  username?: string;
  display_name?: string;
  avatar_url?: string;
  is_online?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { success, error } = useToast();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      // 1. Get conversation memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at, is_pinned')
        .eq('user_id', currentUserId);

      if (membershipsError) throw membershipsError;

      const conversationIds = memberships?.map(m => m.conversation_id) || [];
      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
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

      // 5. Get last message for each conversation
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, sender_id, created_at, message_type')
        .in('conversation_id', conversationIds)
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
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('conversation_id, created_at')
        .in('conversation_id', conversationIds);

      const unreadCountMap = new Map<string, number>();
      memberships?.forEach(membership => {
        const count = unreadMessages?.filter(msg => 
          msg.conversation_id === membership.conversation_id &&
          (!membership.last_read_at || new Date(msg.created_at) > new Date(membership.last_read_at))
        ).length || 0;
        unreadCountMap.set(membership.conversation_id, count);
      });

      // 7. Enrich conversations with all data
      const enrichedConversations: Conversation[] = conversationsData?.map(conv => {
        const convMembers = allMembers?.filter(m => m.conversation_id === conv.id) || [];
        const currentMembership = memberships?.find(m => m.conversation_id === conv.id);
        
        const members: ConversationMember[] = convMembers.map(m => {
          const profile = profilesMap.get(m.user_id);
          return {
            ...m,
            display_name: profile?.full_name || profile?.username
          };
        });

        const otherMember = members.find(m => m.user_id !== currentUserId);

        return {
          ...conv,
          members,
          lastMessage: lastMessageMap.get(conv.id),
          last_message: lastMessageMap.get(conv.id),
          unreadCount: unreadCountMap.get(conv.id) || 0,
          unread_count: unreadCountMap.get(conv.id) || 0,
          isPinned: currentMembership?.is_pinned || false,
          currentUserId: currentUserId,
          other_user: conv.type === 'direct' && otherMember ? {
            id: otherMember.user_id,
            full_name: otherMember.display_name || 'Unknown',
            username: otherMember.username || 'unknown'
          } : undefined
        };
      }) || [];

      setConversations(enrichedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      error('Fehler beim Laden der Chats');
    } finally {
      setLoading(false);
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

    const conversationsChannel = supabase
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

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
        () => {
          loadConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages_changes_for_list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
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

      // Add both members (mit .upsert() statt .insert() für Idempotenz)
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
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
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
      // 1. Check if conversation already exists
      const { data: existingMembers, error: searchError } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', userId);

      if (searchError) throw searchError;

      // Filter for direct conversations
      const directConvIds = existingMembers
        ?.filter((m) => (m as any).conversations.type === 'direct')
        .map((m) => (m as any).conversation_id) || [];

      if (directConvIds.length > 0) {
        // Check which of these conversations includes the other user
        const { data: otherUserMembers, error: otherSearchError } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', directConvIds);

        if (otherSearchError) throw otherSearchError;

        // Found existing conversation
        if (otherUserMembers && otherUserMembers.length > 0) {
          return otherUserMembers[0].conversation_id;
        }
      }

      // 2. No existing conversation, create new one
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
    loading,
    error: undefined, // TODO: Add error state to hook
    loadConversations,
    createDirectConversation,
    createGroupConversation,
    createOrOpenDirectConversation,
    updateConversation,
    leaveConversation,
    markAsRead,
    refresh: loadConversations,
  };
}
