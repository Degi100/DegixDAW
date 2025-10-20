// src/components/social/SocialPreview.tsx
// Preview component for Friends/Followers - Scroll + Load More

import { useState, useEffect } from 'react';
import { useFriends, type Friendship } from '../../hooks/useFriends';
import { useFollowers, type Follower } from '../../hooks/useFollowers';
import { useChat } from '../../contexts/ChatContext';
import { useConversations } from '../../hooks/useConversations';
import { supabase } from '../../lib/supabase';
import Avatar from '../ui/Avatar';
import UserProfileModal from '../profile/UserProfileModal';

interface SocialPreviewProps {
  type: 'friends' | 'followers' | 'following' | 'requests';
}

export default function SocialPreview({ type }: SocialPreviewProps) {
  const { openChat } = useChat();
  const { createOrOpenDirectConversation } = useConversations();
  const { friends, pendingRequests, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriends();
  const { followers, following, removeFollower, unfollowUser } = useFollowers();
  const [showCount, setShowCount] = useState(5);
  const [showAll, setShowAll] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

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

  const getAvatarUrl = (item: Friendship | Follower) => {
    if ('friend_profile' in item) {
      return item.friend_profile?.avatar_url || null;
    }
    if ('profile' in item) {
      return item.profile?.avatar_url || null;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserId = (item: Friendship | Follower): string => {
    if (type === 'friends' && 'friend_id' in item) {
      // For friends: Return the OTHER person's ID (not mine!)
      if (!currentUserId) return '';
      return item.user_id === currentUserId ? item.friend_id : item.user_id;
    }
    if (type === 'followers' && 'follower_id' in item) {
      return item.follower_id;
    }
    if (type === 'following' && 'following_id' in item) {
      return item.following_id;
    }
    if (type === 'requests' && 'user_id' in item) {
      return item.user_id;
    }
    return '';
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

  const handleOpenChat = async (item: Friendship | Follower) => {
    // Get the user ID to chat with
    let chatUserId: string | undefined;

    if ('friend_profile' in item) {
      // For friends, we need to get the OTHER user's ID
      // The friendship can be stored either way: user_id = me + friend_id = them OR user_id = them + friend_id = me
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        chatUserId = item.user_id === user.id ? item.friend_id : item.user_id;
      }
    } else if ('profile' in item) {
      // For followers/following
      chatUserId = type === 'followers' ? item.follower_id : item.following_id;
    }

    if (chatUserId) {
      try {
        // Create or open the conversation (this adds both members!)
        const conversationId = await createOrOpenDirectConversation(chatUserId);
        if (conversationId) {
          // Open the chat sidebar with the conversation
          openChat(chatUserId);
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
  };  return (
    <div className="social-preview">
      <div className={`social-preview-scroll ${showAll ? 'social-preview-scroll--expanded' : ''}`}>
        {data.map((item) => {
          const displayName = getDisplayName(item);
          const username = getUsername(item);
          const avatarUrl = getAvatarUrl(item);

          return (
            <div key={item.id} className="social-preview-item">
              <div onClick={() => setSelectedUserId(getUserId(item))} style={{ cursor: 'pointer' }}>
                <Avatar
                  avatarUrl={avatarUrl}
                  initial={getInitials(displayName)}
                  fullName={displayName}
                  size="medium"
                  shape="rounded"
                  className="preview-item-avatar"
                />
              </div>
              <div className="preview-item-info">
                <div
                  className="preview-item-name"
                  onClick={() => setSelectedUserId(getUserId(item))}
                  style={{ cursor: 'pointer' }}
                >
                  {displayName}
                </div>
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

      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
