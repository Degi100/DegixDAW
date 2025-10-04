// src/components/social/SocialWelcomeCard.tsx
// Social Welcome Card - Dashboard Style

import type { User } from '@supabase/supabase-js';
import UserSearch from './UserSearch';

interface SocialStats {
  friends: number;
  followers: number;
  following: number;
  requests: number;
}

interface SocialWelcomeCardProps {
  user: User;
  stats: SocialStats;
  searchExpanded: boolean;
  onStatClick: (view: 'friends' | 'followers' | 'following' | 'requests') => void;
  onSearchToggle: () => void;
}

export default function SocialWelcomeCard({
  user,
  stats,
  searchExpanded,
  onStatClick,
  onSearchToggle
}: SocialWelcomeCardProps) {
  const displayName = user.user_metadata?.display_name || 
                     user.user_metadata?.full_name || 
                     user.user_metadata?.username || 
                     'Benutzer';
  
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <section className="welcome-section-corporate">
      <div className="welcome-card-corporate">
        {/* Profile Section - Same as Dashboard */}
        <div className="profile-section">
          <div className="profile-avatar">
            {avatarLetter}
          </div>
          
          <div className="profile-info">
            <div className="greeting">
              <h2 className="user-display-name">{displayName}</h2>
              <span className="greeting-text">Deine sozialen Verbindungen</span>
            </div>
            
            {/* Social Details - Same structure as user-details */}
            <div className="user-details">
              {/* Friends */}
              <button
                className="detail-row detail-row--clickable"
                onClick={() => onStatClick('friends')}
              >
                <span className="detail-label">👥 Freunde:</span>
                <span className="detail-value">
                  {stats.friends}
                  <span className="detail-arrow">→</span>
                </span>
              </button>

              {/* Followers */}
              <button
                className="detail-row detail-row--clickable"
                onClick={() => onStatClick('followers')}
              >
                <span className="detail-label">👁️ Follower:</span>
                <span className="detail-value">
                  {stats.followers}
                  <span className="detail-arrow">→</span>
                </span>
              </button>

              {/* Following */}
              <button
                className="detail-row detail-row--clickable"
                onClick={() => onStatClick('following')}
              >
                <span className="detail-label">📤 Folge ich:</span>
                <span className="detail-value">
                  {stats.following}
                  <span className="detail-arrow">→</span>
                </span>
              </button>

              {/* Requests - Only if > 0 */}
              {stats.requests > 0 && (
                <button
                  className="detail-row detail-row--clickable detail-row--highlight"
                  onClick={() => onStatClick('requests')}
                >
                  <span className="detail-label">📬 Anfragen:</span>
                  <span className="detail-value">
                    {stats.requests}
                    <span className="detail-arrow">→</span>
                  </span>
                </button>
              )}

              {/* Divider */}
              <div className="detail-divider" />

              {/* Search Toggle */}
              <button
                className={`detail-row detail-row--clickable ${searchExpanded ? 'detail-row--expanded' : ''}`}
                onClick={onSearchToggle}
              >
                <span className="detail-label">🔍 Neue Freunde finden</span>
                <span className="detail-toggle">{searchExpanded ? '▲' : '▼'}</span>
              </button>

              {/* Search Expanded */}
              {searchExpanded && (
                <div className="detail-expanded">
                  <UserSearch />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
