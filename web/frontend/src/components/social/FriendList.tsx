// src/components/social/FriendList.tsx
// Friend List with Requests

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '../../hooks/useFriends';
import { useConversations } from '../../hooks/useConversations';
import { Spinner } from '../ui/Loading';
import Avatar from '../ui/Avatar';

export default function FriendList() {
  const navigate = useNavigate();
  const [loadingChat, setLoadingChat] = useState<string | null>(null);
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useFriends();
  const { createOrOpenDirectConversation } = useConversations();

  const handleOpenChat = async (userId: string) => {
    setLoadingChat(userId);
    try {
      const conversationId = await createOrOpenDirectConversation(userId);
      if (conversationId) {
        navigate(`/chat/${conversationId}`);
      }
    } catch (err) {
      console.error('Error opening chat:', err);
    } finally {
      setLoadingChat(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="friend-list__loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="friend-list">
      {/* Pending Requests (Received) */}
      {pendingRequests.length > 0 && (
        <div className="friend-list__section">
          <h3 className="friend-list__title">
            📬 Freundschaftsanfragen ({pendingRequests.length})
          </h3>
          <div className="friend-list__grid">
            {pendingRequests.map(request => (
              <div key={request.id} className="friend-card friend-card--pending">
                <div className="friend-card__info">
                  <Avatar
                    avatarUrl={request.friend_profile?.avatar_url || null}
                    initial={getInitials(request.friend_profile?.full_name)}
                    fullName={request.friend_profile?.full_name || 'Unbekannt'}
                    size="medium"
                    shape="rounded"
                    className="friend-card__avatar"
                  />
                  <div>
                    <div className="friend-card__name">
                      {request.friend_profile?.full_name || 'Unbekannt'}
                    </div>
                    <div className="friend-card__username">
                      @{request.friend_profile?.username || 'unknown'}
                    </div>
                  </div>
                </div>
                <div className="friend-card__actions">
                  <button
                    onClick={() => acceptFriendRequest(request.id)}
                    className="friend-card__btn friend-card__btn--accept"
                  >
                    ✅ Annehmen
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request.id)}
                    className="friend-card__btn friend-card__btn--reject"
                  >
                    ❌ Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="friend-list__section">
          <h3 className="friend-list__title">
            ⏳ Gesendete Anfragen ({sentRequests.length})
          </h3>
          <div className="friend-list__grid">
            {sentRequests.map(request => (
              <div key={request.id} className="friend-card friend-card--sent">
                <div className="friend-card__info">
                  <Avatar
                    avatarUrl={request.friend_profile?.avatar_url || null}
                    initial={getInitials(request.friend_profile?.full_name)}
                    fullName={request.friend_profile?.full_name || 'Unbekannt'}
                    size="medium"
                    shape="rounded"
                    className="friend-card__avatar"
                  />
                  <div>
                    <div className="friend-card__name">
                      {request.friend_profile?.full_name || 'Unbekannt'}
                    </div>
                    <div className="friend-card__username">
                      @{request.friend_profile?.username || 'unknown'}
                    </div>
                  </div>
                </div>
                <div className="friend-card__status">
                  Wartet auf Antwort...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="friend-list__section">
        <h3 className="friend-list__title">
          👥 Freunde ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="friend-list__empty">
            Noch keine Freunde. Suche nach Benutzern und sende Freundschaftsanfragen!
          </div>
        ) : (
          <div className="friend-list__grid">
            {friends.map(friendship => (
              <div key={friendship.id} className="friend-card">
                <div className="friend-card__info">
                  <Avatar
                    avatarUrl={friendship.friend_profile?.avatar_url || null}
                    initial={getInitials(friendship.friend_profile?.full_name)}
                    fullName={friendship.friend_profile?.full_name || 'Unbekannt'}
                    size="medium"
                    shape="rounded"
                    className="friend-card__avatar"
                  />
                  <div>
                    <div className="friend-card__name">
                      {friendship.friend_profile?.full_name || 'Unbekannt'}
                    </div>
                    <div className="friend-card__username">
                      @{friendship.friend_profile?.username || 'unknown'}
                    </div>
                  </div>
                </div>
                <div className="friend-card__actions">
                  <button
                    onClick={() => handleOpenChat(friendship.friend_id)}
                    className="friend-card__btn friend-card__btn--chat"
                    title="Nachricht senden"
                    disabled={loadingChat === friendship.friend_id}
                  >
                    {loadingChat === friendship.friend_id ? '⏳' : '💬'}
                  </button>
                  <button
                    onClick={() => removeFriend(friendship.id)}
                    className="friend-card__btn friend-card__btn--remove"
                    title="Freundschaft beenden"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
