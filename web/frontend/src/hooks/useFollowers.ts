// src/hooks/useFollowers.ts
// Follower/Following Management Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  // Joined data
  profile?: {
    full_name: string;
    username: string;
  };
}

export function useFollowers(userId?: string) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
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

  // Load followers and following
  const loadFollowers = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      // Get followers (people who follow me)
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select('*')
        .eq('following_id', currentUserId);

      if (followersError) throw followersError;

      // Get following (people I follow)
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', currentUserId);

      if (followingError) throw followingError;

      // Load profile data for all users
      const allUserIds = new Set<string>();
      followersData?.forEach(f => allUserIds.add(f.follower_id));
      followingData?.forEach(f => allUserIds.add(f.following_id));

      const profilesMap = new Map();
      if (allUserIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', Array.from(allUserIds));
        
        profilesData?.forEach(p => profilesMap.set(p.id, p));
      }

      // Attach profiles
      setFollowers(followersData?.map(f => ({ ...f, profile: profilesMap.get(f.follower_id) })) || []);
      setFollowing(followingData?.map(f => ({ ...f, profile: profilesMap.get(f.following_id) })) || []);
    } catch (err) {
      console.error('Error loading followers:', err);
      error('Fehler beim Laden der Follower');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, error]);

  useEffect(() => {
    if (currentUserId) {
      loadFollowers();
    }
  }, [currentUserId, loadFollowers]);

  // Real-time subscription for followers
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('followers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
          filter: `follower_id=eq.${currentUserId}`,
        },
        () => {
          loadFollowers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
          filter: `following_id=eq.${currentUserId}`,
        },
        () => {
          loadFollowers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadFollowers]);

  // Follow a user
  const followUser = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error: insertError } = await supabase
        .from('followers')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

      if (insertError) throw insertError;

      success('Du folgst jetzt diesem User! 👍');
      loadFollowers();
    } catch (err) {
      console.error('Error following user:', err);
      error('Fehler beim Folgen');
    }
  }, [currentUserId, success, error, loadFollowers]);

  // Unfollow a user
  const unfollowUser = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const { error: deleteError } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (deleteError) throw deleteError;

      success('Du folgst diesem User nicht mehr');
      loadFollowers();
    } catch (err) {
      console.error('Error unfollowing user:', err);
      error('Fehler beim Entfolgen');
    }
  }, [currentUserId, success, error, loadFollowers]);

  // Remove a follower
  const removeFollower = useCallback(async (followerId: string) => {
    if (!currentUserId) return;
    if (!confirm('Diesen Follower wirklich entfernen?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', currentUserId);

      if (deleteError) throw deleteError;

      success('Follower entfernt');
      loadFollowers();
    } catch (err) {
      console.error('Error removing follower:', err);
      error('Fehler beim Entfernen des Followers');
    }
  }, [currentUserId, success, error, loadFollowers]);

  // Check if following a user
  const isFollowing = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { data, error: queryError } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();

      if (queryError && queryError.code !== 'PGRST116') throw queryError;

      return !!data;
    } catch (err) {
      console.error('Error checking follow status:', err);
      return false;
    }
  }, [currentUserId]);

  // Get follower/following counts
  const getCounts = useCallback(async (targetUserId?: string) => {
    const userId = targetUserId || currentUserId;
    if (!userId) return { followers: 0, following: 0 };

    try {
      const [followersCount, followingCount] = await Promise.all([
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);

      return {
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
      };
    } catch (err) {
      console.error('Error getting counts:', err);
      return { followers: 0, following: 0 };
    }
  }, [currentUserId]);

  return {
    followers,
    following,
    loading,
    followUser,
    unfollowUser,
    removeFollower,
    isFollowing,
    getCounts,
    refresh: loadFollowers,
  };
}
