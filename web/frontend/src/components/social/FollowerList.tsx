// src/components/social/FollowerList.tsx
// Follower/Following List

import { useFollowers } from '../../hooks/useFollowers';
import { Spinner } from '../ui/Loading';

export default function FollowerList() {
  const {
    followers,
    following,
    loading,
    unfollowUser,
    removeFollower,
  } = useFollowers();

  if (loading) {
    return (
      <div className="follower-list__loading">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="follower-list">
      {/* Following */}
      <div className="follower-list__section">
        <h3 className="follower-list__title">
          👁️ Du folgst ({following.length})
        </h3>
        {following.length === 0 ? (
          <div className="follower-list__empty">
            Du folgst noch niemandem. Suche nach interessanten Benutzern!
          </div>
        ) : (
          <div className="follower-list__grid">
            {following.map(follow => (
              <div key={follow.id} className="follower-card">
                <div className="follower-card__info">
                  <div className="follower-card__avatar">
                    {follow.profile?.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="follower-card__name">
                      {follow.profile?.full_name || 'Unbekannt'}
                    </div>
                    <div className="follower-card__username">
                      @{follow.profile?.username || 'unknown'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => unfollowUser(follow.following_id)}
                  className="follower-card__btn follower-card__btn--unfollow"
                  title="Entfolgen"
                >
                  ✓ Folgst du
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followers */}
      <div className="follower-list__section">
        <h3 className="follower-list__title">
          👥 Follower ({followers.length})
        </h3>
        {followers.length === 0 ? (
          <div className="follower-list__empty">
            Noch keine Follower
          </div>
        ) : (
          <div className="follower-list__grid">
            {followers.map(follower => (
              <div key={follower.id} className="follower-card">
                <div className="follower-card__info">
                  <div className="follower-card__avatar">
                    {follower.profile?.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="follower-card__name">
                      {follower.profile?.full_name || 'Unbekannt'}
                    </div>
                    <div className="follower-card__username">
                      @{follower.profile?.username || 'unknown'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFollower(follower.follower_id)}
                  className="follower-card__btn follower-card__btn--remove"
                  title="Follower entfernen"
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
