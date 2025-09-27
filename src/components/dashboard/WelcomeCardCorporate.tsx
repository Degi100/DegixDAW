// src/components/dashboard/WelcomeCardCorporate.tsx
// Ultimate Corporate Welcome Card with Professional Design

import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import Button from '../ui/Button';

interface WelcomeCardCorporateProps {
  user: User;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export default function WelcomeCardCorporate({ user, onNavigateToSettings, onLogout }: WelcomeCardCorporateProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  // Generate user avatar initials
  const getInitials = () => {
    const name = user.user_metadata?.full_name || user.user_metadata?.username || user.email;
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get user's current time greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <section className="welcome-section-corporate">
      <div className="welcome-card-corporate">
        {/* User Profile Section */}
        <div className="profile-section">
          <div className="profile-avatar">
            {getInitials()}
          </div>
          
          <div className="profile-info">
            <div className="greeting">
              <span className="greeting-text">{getTimeGreeting()},</span>
              <h2 className="user-display-name">
                {user.user_metadata?.full_name || user.user_metadata?.username || 'User'}
              </h2>
            </div>
            
            <div className="user-meta">
              {user.user_metadata?.username && (
                <span className="username-badge">@{user.user_metadata.username}</span>
              )}
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🎵</div>
            <div className="stat-content">
              <div className="stat-number">0</div>
              <div className="stat-label">Projects</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">0h</div>
              <div className="stat-label">Studio Time</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-number">0</div>
              <div className="stat-label">Collaborations</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          <div className="primary-actions">
            <Button 
              onClick={() => {/* TODO: Create new project */}}
              variant="primary"
              size="large"
            >
              🎼 New Project
            </Button>
            
            <Button 
              onClick={onNavigateToSettings}
              variant="outline"
            >
              ⚙️ Settings
            </Button>
          </div>
          
          <div className="secondary-actions">
            {isAdmin && (
              <Button 
                onClick={handleAdminPanel}
                variant="success"
                size="small"
              >
                🛡️ Admin
              </Button>
            )}
            
            <Button 
              onClick={onLogout}
              variant="outline"
              size="small"
            >
              👋 Sign Out
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}