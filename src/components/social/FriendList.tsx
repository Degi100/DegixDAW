// src/components/social/FriendList.tsx
// Friend List with Requests

import { useFriends } from '../../hooks/useFriends';
import { Spinner } from '../ui/Loading';

export default function FriendList() {
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useFriends();

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
                  <div className="friend-card__avatar">
                    {request.friend_profile?.full_name?.[0] || '?'}
                  </div>
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
                  <div className="friend-card__avatar">
                    {request.friend_profile?.full_name?.[0] || '?'}
                  </div>
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
                  <div className="friend-card__avatar">
                    {friendship.friend_profile?.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="friend-card__name">
                      {friendship.friend_profile?.full_name || 'Unbekannt'}
                    </div>
                    <div className="friend-card__username">
                      @{friendship.friend_profile?.username || 'unknown'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friendship.id)}
                  className="friend-card__btn friend-card__btn--remove"
                  title="Freundschaft beenden"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
