// ============================================
// USE AVATAR HOOK
// Centralized avatar logic with fallback to initials
// ============================================

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AvatarData {
  avatarUrl: string | null;
  initial: string;
  fullName: string;
  hasAvatar: boolean;
}

/**
 * Hook to get avatar URL or fallback to user initial
 * Supports both User object and profile ID
 */
export function useAvatar(
  user: User | null | undefined,
  profileId?: string
): AvatarData {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Extract initial from user metadata
  const getInitial = (): string => {
    if (!user) return '?';

    const name =
      user.user_metadata?.first_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.username ||
      user.email ||
      '?';

    return name.charAt(0).toUpperCase();
  };

  // Extract full name from user metadata
  const getFullName = (): string => {
    if (!user) return 'Unknown';

    return (
      user.user_metadata?.full_name ||
      `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
      user.user_metadata?.username ||
      user.email ||
      'Unknown'
    );
  };

  // Load avatar URL from profiles table (if profileId provided)
  useEffect(() => {
    if (!profileId) {
      // Use user_metadata avatar_url if no profileId
      setAvatarUrl(user?.user_metadata?.avatar_url || null);
      return;
    }

    const loadAvatar = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', profileId)
          .single();

        if (error) {
          console.warn('Error loading avatar:', error);
          setAvatarUrl(null);
        } else {
          setAvatarUrl(data?.avatar_url || null);
        }
      } catch (err) {
        console.warn('Error loading avatar:', err);
        setAvatarUrl(null);
      }
    };

    loadAvatar();
  }, [profileId, user?.user_metadata?.avatar_url]);

  return {
    avatarUrl,
    initial: getInitial(),
    fullName: getFullName(),
    hasAvatar: !!avatarUrl,
  };
}

/**
 * Hook for avatar from another user (by user ID)
 * Loads avatar from profiles table
 */
export function useUserAvatar(userId: string | null | undefined): AvatarData {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState('?');
  const [fullName, setFullName] = useState('Unknown');

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      setInitial('?');
      setFullName('Unknown');
      return;
    }

    const loadUserAvatar = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, username')
          .eq('id', userId)
          .single();

        if (error) {
          console.warn('Error loading user avatar:', error);
          setAvatarUrl(null);
          setInitial('?');
          setFullName('Unknown');
        } else {
          setAvatarUrl(data?.avatar_url || null);
          const name = data?.full_name || data?.username || 'Unknown';
          setFullName(name);
          setInitial(name.charAt(0).toUpperCase());
        }
      } catch (err) {
        console.warn('Error loading user avatar:', err);
        setAvatarUrl(null);
        setInitial('?');
        setFullName('Unknown');
      }
    };

    loadUserAvatar();
  }, [userId]);

  return {
    avatarUrl,
    initial,
    fullName,
    hasAvatar: !!avatarUrl,
  };
}
