// src/components/social/UserCard.tsx
// User Card with Friend/Follow Actions

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useFriends } from '../../hooks/useFriends';
import { useFollowers } from '../../hooks/useFollowers';
import type { SearchUser } from '../../hooks/useUserSearch';

interface UserCardProps {
  user: SearchUser;
  showActions?: boolean;
}

export default function UserCard({ user, showActions = true }: UserCardProps) {
  const { sendFriendRequest, getFriendshipStatus } = useFriends();
  const { followUser, unfollowUser, isFollowing: checkFollowing } = useFollowers();
  
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    const [friendship, following] = await Promise.all([
      getFriendshipStatus(user.id),
      checkFollowing(user.id),
    ]);
    setFriendshipStatus(friendship);
    setIsFollowing(following);
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Real-time subscription for this specific user's status
  useEffect(() => {
    const channel = supabase
      .channel(`user_status_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          loadStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'followers',
        },
        () => {
          loadStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleFriendRequest = async () => {
    setLoading(true);
    await sendFriendRequest(user.id);
    await loadStatus();
    setLoading(false);
  };

  const handleFollow = async () => {
    setLoading(true);
    if (isFollowing) {
      await unfollowUser(user.id);
    } else {
      await followUser(user.id);
    }
    await loadStatus();
    setLoading(false);
  };

  return (
    <div className="user-card">
      <div className="user-card__info">
        <div className="user-card__name">{user.full_name}</div>
        <div className="user-card__username">@{user.username}</div>
      </div>

      {showActions && (
        <div className="user-card__actions">
          {/* Friend Button */}
          {friendshipStatus === 'none' && (
            <button
              onClick={handleFriendRequest}
              disabled={loading}
              className="user-card__btn user-card__btn--friend"
              title="Freundschaftsanfrage senden"
            >
              👥 Freund anfragen
            </button>
          )}

          {friendshipStatus === 'pending_sent' && (
            <button
              disabled
              className="user-card__btn user-card__btn--pending"
            >
              ⏳ Anfrage gesendet
            </button>
          )}

          {friendshipStatus === 'pending_received' && (
            <button
              disabled
              className="user-card__btn user-card__btn--pending"
            >
              📬 Anfrage erhalten
            </button>
          )}

          {friendshipStatus === 'friends' && (
            <button
              disabled
              className="user-card__btn user-card__btn--friends"
            >
              ✅ Befreundet
            </button>
          )}

          {/* Follow Button */}
          <button
            onClick={handleFollow}
            disabled={loading}
            className={`user-card__btn ${isFollowing ? 'user-card__btn--following' : 'user-card__btn--follow'}`}
            title={isFollowing ? 'Entfolgen' : 'Folgen'}
          >
            {isFollowing ? '✓ Folgst du' : '➕ Folgen'}
          </button>
        </div>
      )}
    </div>
  );
}
