// src/pages/dashboard/Social.tsx
// Social Connections Page - Friends & Followers

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SocialWelcomeCard from '../../components/social/SocialWelcomeCard';
import FriendList from '../../components/social/FriendList';
import FollowerList from '../../components/social/FollowerList';
import { useFriends } from '../../hooks/useFriends';
import { useFollowers } from '../../hooks/useFollowers';

type ContentView = 'none' | 'friends' | 'followers' | 'following' | 'requests';

export default function Social() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ContentView>('none');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { friends, pendingRequests } = useFriends();
  const { followers, following } = useFollowers();

  const handleStatClick = (view: ContentView) => {
    setActiveView(view);
    setSearchExpanded(false);
  };

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    setActiveView('none');
  };

  if (!user) {
    return (
      <div className="dashboard-corporate">
        <main className="dashboard-main">
          <div className="dashboard-container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Lade Social...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-corporate">
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Main Welcome Card - Dashboard Style */}
          <SocialWelcomeCard
            user={user}
            stats={{
              friends: friends.length,
              followers: followers.length,
              following: following.length,
              requests: pendingRequests.length
            }}
            searchExpanded={searchExpanded}
            onStatClick={handleStatClick}
            onSearchToggle={handleSearchToggle}
          />

          {/* Content Section - Shows when stat is clicked */}
          {activeView !== 'none' && (
            <div className="social-content-section">
              <h3 className="content-section-title">
                {activeView === 'friends' && '👥 Deine Freunde'}
                {activeView === 'followers' && '👁️ Deine Follower'}
                {activeView === 'following' && '📤 Du folgst'}
                {activeView === 'requests' && '📬 Freundschaftsanfragen'}
              </h3>
              {activeView === 'friends' && <FriendList />}
              {activeView === 'followers' && <FollowerList />}
              {activeView === 'following' && <FollowerList />}
              {activeView === 'requests' && <FriendList />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
