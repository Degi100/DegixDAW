// src/components/social/SocialPreview.tsx
// Preview component for Friends/Followers - Scroll + Load More

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends, type Friendship } from '../../hooks/useFriends';
import { useFollowers, type Follower } from '../../hooks/useFollowers';

interface SocialPreviewProps {
  type: 'friends' | 'followers' | 'following' | 'requests';
}

export default function SocialPreview({ type }: SocialPreviewProps) {
  const navigate = useNavigate();
  const { friends, pendingRequests, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriends();
  const { followers, following, removeFollower, unfollowUser } = useFollowers();
  const [showCount, setShowCount] = useState(5);
  const [showAll, setShowAll] = useState(false);

  // Get data based on type
  const getData = (): (Friendship | Follower)[] => {
    const allData = (() => {
      switch (type) {
        case 'friends':
          return friends;
        case 'followers':
          return followers;
        case 'following':
          return following;
        case 'requests':
          return pendingRequests;
        default:
          return [];
      }
    })();

    return showAll ? allData : allData.slice(0, showCount);
  };

  const getTotal = () => {
    switch (type) {
      case 'friends':
        return friends.length;
      case 'followers':
        return followers.length;
      case 'following':
        return following.length;
      case 'requests':
        return pendingRequests.length;
      default:
        return 0;
    }
  };

  const data = getData();
  const total = getTotal();
  const hasMore = !showAll && total > showCount;

  const loadMore = () => {
    setShowCount(prev => Math.min(prev + 5, total));
  };

  const handleShowAll = () => {
    setShowAll(true);
  };

  if (data.length === 0) {
    return (
      <div className="social-preview-empty">
        <p>Noch keine Einträge</p>
      </div>
    );
  }

  const getDisplayName = (item: Friendship | Follower) => {
    if ('friend_profile' in item) {
      return item.friend_profile?.username || item.friend_profile?.full_name || 'Unbekannt';
    }
    if ('profile' in item) {
      return item.profile?.username || item.profile?.full_name || 'Unbekannt';
    }
    return 'Unbekannt';
  };

  const getUsername = (item: Friendship | Follower) => {
    if ('friend_profile' in item) {
      return item.friend_profile?.username;
    }
    if ('profile' in item) {
      return item.profile?.username;
    }
    return null;
  };

  const handleRemove = (item: Friendship | Follower) => {
    if (type === 'friends' && 'friend_profile' in item) {
      removeFriend(item.id);
    } else if (type === 'followers' && 'profile' in item) {
      removeFollower(item.follower_id);
    } else if (type === 'following' && 'profile' in item) {
      unfollowUser(item.following_id);
    }
  };

  const handleOpenChat = (item: Friendship | Follower) => {
    // Get the user ID to chat with
    let chatUserId: string | undefined;
    
    if ('friend_profile' in item) {
      // For friends, get the friend_id
      chatUserId = item.friend_id;
    } else if ('profile' in item) {
      // For followers/following
      chatUserId = type === 'followers' ? item.follower_id : item.following_id;
    }

    if (chatUserId) {
      // Navigate to chat with this user
      navigate(`/chat?user=${chatUserId}`);
    }
  };

  return (
    <div className="social-preview">
      <div className={`social-preview-scroll ${showAll ? 'social-preview-scroll--expanded' : ''}`}>
        {data.map((item) => {
          const displayName = getDisplayName(item);
          const username = getUsername(item);
          
          return (
            <div key={item.id} className="social-preview-item">
              <div className="preview-item-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="preview-item-info">
                <div className="preview-item-name">{displayName}</div>
                {username && (
                  <div className="preview-item-handle">@{username}</div>
                )}
              </div>
              <div className="preview-item-actions">
                {type === 'requests' && 'friend_profile' in item ? (
                  <>
                    <button 
                      className="preview-action-btn preview-action-btn--accept" 
                      title="Akzeptieren"
                      onClick={() => acceptFriendRequest(item.id)}
                    >
                      ✓
                    </button>
                    <button 
                      className="preview-action-btn preview-action-btn--decline" 
                      title="Ablehnen"
                      onClick={() => rejectFriendRequest(item.id)}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="preview-action-btn preview-action-btn--message" 
                      title="Nachricht senden"
                      onClick={() => handleOpenChat(item)}
                    >
                      ✉️
                    </button>
                    <button 
                      className="preview-action-btn preview-action-btn--profile" 
                      title="Profil ansehen"
                      onClick={() => {/* TODO: View profile */}}
                    >
                      👤
                    </button>
                    <button 
                      className="preview-action-btn preview-action-btn--remove" 
                      title="Entfernen"
                      onClick={() => handleRemove(item)}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="social-preview-actions">
        {hasMore && (
          <button className="social-preview-load-more" onClick={loadMore}>
            Nächste 5 laden ({total - showCount} verbleibend)
          </button>
        )}
        {!showAll && (
          <button className="social-preview-view-all" onClick={handleShowAll}>
            Alle {total} anzeigen (scroll)
          </button>
        )}
      </div>
    </div>
  );
}
