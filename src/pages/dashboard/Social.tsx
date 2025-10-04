// src/pages/dashboard/Social.tsx
// Social Connections Page - Friends & Followers

import { useState } from 'react';
import UserSearch from '../../components/social/UserSearch';
import FriendList from '../../components/social/FriendList';
import FollowerList from '../../components/social/FollowerList';
import { useFriends } from '../../hooks/useFriends';
import { useFollowers } from '../../hooks/useFollowers';

export default function Social() {
  const [activeTab, setActiveTab] = useState<'search' | 'friends' | 'followers'>('search');
  const { friends, pendingRequests } = useFriends();
  const { followers, following } = useFollowers();

  return (
    <div className="social-page">
      <div className="social-page__header">
        <h1 className="social-page__title">👥 Soziale Verbindungen</h1>
        <p className="social-page__subtitle">
          Finde Freunde, folge interessanten Personen und verwalte deine Verbindungen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="social-page__stats">
        <div className="social-stat-card">
          <div className="social-stat-card__icon">👥</div>
          <div className="social-stat-card__info">
            <div className="social-stat-card__value">{friends.length}</div>
            <div className="social-stat-card__label">Freunde</div>
          </div>
        </div>

        <div className="social-stat-card">
          <div className="social-stat-card__icon">👁️</div>
          <div className="social-stat-card__info">
            <div className="social-stat-card__value">{following.length}</div>
            <div className="social-stat-card__label">Folge ich</div>
          </div>
        </div>

        <div className="social-stat-card">
          <div className="social-stat-card__icon">👤</div>
          <div className="social-stat-card__info">
            <div className="social-stat-card__value">{followers.length}</div>
            <div className="social-stat-card__label">Follower</div>
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div className="social-stat-card social-stat-card--highlight">
            <div className="social-stat-card__icon">📬</div>
            <div className="social-stat-card__info">
              <div className="social-stat-card__value">{pendingRequests.length}</div>
              <div className="social-stat-card__label">Anfragen</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="social-page__tabs">
        <button
          className={`social-tab ${activeTab === 'search' ? 'social-tab--active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Suchen
        </button>
        <button
          className={`social-tab ${activeTab === 'friends' ? 'social-tab--active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👥 Freunde
          {pendingRequests.length > 0 && (
            <span className="social-tab__badge">{pendingRequests.length}</span>
          )}
        </button>
        <button
          className={`social-tab ${activeTab === 'followers' ? 'social-tab--active' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          👁️ Follower
        </button>
      </div>

      {/* Content */}
      <div className="social-page__content">
        {activeTab === 'search' && <UserSearch />}
        {activeTab === 'friends' && <FriendList />}
        {activeTab === 'followers' && <FollowerList />}
      </div>
    </div>
  );
}
