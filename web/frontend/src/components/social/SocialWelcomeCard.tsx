// src/components/social/SocialWelcomeCard.tsx
// Social Welcome Card - Dashboard Style

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import UserSearch from './UserSearch';
import SocialPreview from './SocialPreview';

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
  onSearchToggle: () => void;
}

type ExpandedView = 'friends' | 'followers' | 'following' | 'requests' | 'search' | null;

export default function SocialWelcomeCard({
  user,
  stats,
  searchExpanded,
  onSearchToggle
}: SocialWelcomeCardProps) {
  const [expandedView, setExpandedView] = useState<ExpandedView>(null);
  
  const displayName = user.user_metadata?.display_name ||
                     user.user_metadata?.full_name ||
                     user.user_metadata?.username ||
                     'Benutzer';

  const handleStatToggle = (view: ExpandedView) => {
    // Simply toggle - no confirm needed
    setExpandedView(expandedView === view ? null : view);
  };

  return (
    <section className="welcome-section-corporate">
      <div className="welcome-card-corporate">
        {/* Profile Section - Same as Dashboard */}
        <div className="profile-section">
          <div className="profile-info">
            <div className="greeting">
              <h2 className="user-display-name">{displayName}</h2>
              <span className="greeting-text">Deine sozialen Verbindungen</span>
            </div>
            
            {/* Social Details - Same structure as user-details */}
            <div className="user-details">
              {/* Friends */}
              <button
                className={`detail-row detail-row--clickable ${expandedView === 'friends' ? 'detail-row--expanded' : ''}`}
                onClick={() => handleStatToggle('friends')}
              >
                <span className="detail-label">👥 Freunde:</span>
                <span className="detail-value">
                  {stats.friends}
                  <span className="detail-toggle">{expandedView === 'friends' ? '▲' : '▼'}</span>
                </span>
              </button>
              {expandedView === 'friends' && (
                <div className="detail-expanded">
                  <SocialPreview type="friends" />
                </div>
              )}

              {/* Followers */}
              <button
                className={`detail-row detail-row--clickable ${expandedView === 'followers' ? 'detail-row--expanded' : ''}`}
                onClick={() => handleStatToggle('followers')}
              >
                <span className="detail-label">👁️ Follower:</span>
                <span className="detail-value">
                  {stats.followers}
                  <span className="detail-toggle">{expandedView === 'followers' ? '▲' : '▼'}</span>
                </span>
              </button>
              {expandedView === 'followers' && (
                <div className="detail-expanded">
                  <SocialPreview type="followers" />
                </div>
              )}

              {/* Following */}
              <button
                className={`detail-row detail-row--clickable ${expandedView === 'following' ? 'detail-row--expanded' : ''}`}
                onClick={() => handleStatToggle('following')}
              >
                <span className="detail-label">📤 Folge ich:</span>
                <span className="detail-value">
                  {stats.following}
                  <span className="detail-toggle">{expandedView === 'following' ? '▲' : '▼'}</span>
                </span>
              </button>
              {expandedView === 'following' && (
                <div className="detail-expanded">
                  <SocialPreview type="following" />
                </div>
              )}

              {/* Requests - Only if > 0 */}
              {stats.requests > 0 && (
                <>
                  <button
                    className={`detail-row detail-row--clickable detail-row--highlight ${expandedView === 'requests' ? 'detail-row--expanded' : ''}`}
                    onClick={() => handleStatToggle('requests')}
                  >
                    <span className="detail-label">📬 Anfragen:</span>
                    <span className="detail-value">
                      {stats.requests}
                      <span className="detail-toggle">{expandedView === 'requests' ? '▲' : '▼'}</span>
                    </span>
                  </button>
                  {expandedView === 'requests' && (
                    <div className="detail-expanded">
                      <SocialPreview type="requests" />
                    </div>
                  )}
                </>
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
