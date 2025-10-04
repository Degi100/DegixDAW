// src/pages/dashboard/Social.tsx
// Social Connections Page - Friends & Followers

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SocialWelcomeCard from '../../components/social/SocialWelcomeCard';
import { useFriends } from '../../hooks/useFriends';
import { useFollowers } from '../../hooks/useFollowers';

export default function Social() {
  const { user } = useAuth();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { friends, pendingRequests } = useFriends();
  const { followers, following } = useFollowers();

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
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
            onSearchToggle={handleSearchToggle}
          />
        </div>
      </main>
    </div>
  );
}
