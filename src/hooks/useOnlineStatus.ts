import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for tracking user online/offline status using Supabase Presence
 * 
 * Features:
 * - Tracks online status for multiple users
 * - Realtime updates via Supabase Presence API
 * - Automatic cleanup on unmount
 * 
 * @returns Object with online users Map and utility functions
 */
export function useOnlineStatus() {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    // Track presence for current user
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newOnlineUsers = new Map<string, boolean>();

        Object.keys(state).forEach((userId) => {
          newOnlineUsers.set(userId, true);
        });

        setOnlineUsers(newOnlineUsers);
        console.log('👥 Online users:', Array.from(newOnlineUsers.keys()));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('✅ User joined:', key);
        setOnlineUsers((prev) => new Map(prev).set(key as string, true));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 User left:', key);
        setOnlineUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(key as string);
          return newMap;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as online
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId]);

  /**
   * Check if a specific user is online
   */
  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  return {
    onlineUsers,
    isUserOnline,
  };
}
