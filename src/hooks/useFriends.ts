// src/hooks/useFriends.ts
// Friend Management Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requested_at: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  friend_profile?: {
    full_name: string;
    username: string;
  };
}

export function useFriends(userId?: string) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const { success, error } = useToast();

  // Get current user ID
  useEffect(() => {
    if (!userId) {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUserId(data.user?.id || null);
      });
    }
  }, [userId]);

  // Load all friendships
  const loadFriendships = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      // Get accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // Get pending requests (received)
      const { data: pendingData, error: pendingError } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get sent requests
      const { data: sentData, error: sentError } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Load profile data for all users
      const allUserIds = new Set<string>();
      friendsData?.forEach(f => {
        allUserIds.add(f.user_id === currentUserId ? f.friend_id : f.user_id);
      });
      pendingData?.forEach(p => allUserIds.add(p.user_id));
      sentData?.forEach(s => allUserIds.add(s.friend_id));

      const profilesMap = new Map();
      if (allUserIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', Array.from(allUserIds));
        
        profilesData?.forEach(p => profilesMap.set(p.id, p));
      }

      // Attach profiles to friendships
      const enrichFriendship = (f: Friendship) => ({
        ...f,
        friend_profile: profilesMap.get(f.user_id === currentUserId ? f.friend_id : f.user_id)
      });

      setFriends(friendsData?.map(enrichFriendship) || []);
      setPendingRequests(pendingData?.map(f => ({ ...f, friend_profile: profilesMap.get(f.user_id) })) || []);
      setSentRequests(sentData?.map(f => ({ ...f, friend_profile: profilesMap.get(f.friend_id) })) || []);
    } catch (err) {
      console.error('Error loading friendships:', err);
      error('Fehler beim Laden der Freundschaften');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, error]);

  useEffect(() => {
    if (currentUserId) {
      loadFriendships();
    }
  }, [currentUserId, loadFriendships]);

  // Real-time subscription for friendships
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('friendships_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          loadFriendships();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${currentUserId}`,
        },
        () => {
          loadFriendships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadFriendships]);

  // Send friend request
  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!currentUserId) return;

    try {
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: 'pending',
        });

      if (insertError) throw insertError;

      success('Freundschaftsanfrage gesendet! 🎉');
      loadFriendships();
    } catch (err) {
      console.error('Error sending friend request:', err);
      error('Fehler beim Senden der Freundschaftsanfrage');
    }
  }, [currentUserId, success, error, loadFriendships]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (updateError) throw updateError;

      success('Freundschaftsanfrage angenommen! ✅');
      loadFriendships();
    } catch (err) {
      console.error('Error accepting friend request:', err);
      error('Fehler beim Annehmen der Freundschaftsanfrage');
    }
  }, [success, error, loadFriendships]);

  // Reject friend request
  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('friendships')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (updateError) throw updateError;

      success('Freundschaftsanfrage abgelehnt');
      loadFriendships();
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      error('Fehler beim Ablehnen der Freundschaftsanfrage');
    }
  }, [success, error, loadFriendships]);

  // Remove friend
  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!confirm('Freundschaft wirklich beenden?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (deleteError) throw deleteError;

      success('Freundschaft beendet');
      loadFriendships();
    } catch (err) {
      console.error('Error removing friend:', err);
      error('Fehler beim Beenden der Freundschaft');
    }
  }, [success, error, loadFriendships]);

  // Check friendship status with another user
  const getFriendshipStatus = useCallback(async (otherUserId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> => {
    if (!currentUserId) return 'none';

    try {
      const { data, error: queryError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${currentUserId})`);

      if (queryError) throw queryError;

      if (!data || data.length === 0) return 'none';

      const friendship = data[0];

      if (friendship.status === 'accepted') return 'friends';
      if (friendship.user_id === currentUserId) return 'pending_sent';
      return 'pending_received';
    } catch (err) {
      console.error('Error checking friendship status:', err);
      return 'none';
    }
  }, [currentUserId]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriendshipStatus,
    refresh: loadFriendships,
  };
}
