// src/components/dashboard/WelcomeCard.tsx
// Corporate WelcomeCard with streamlined interface (navigation moved to header)

import type { User } from '@supabase/supabase-js';
import Button from '../ui/Button';
import RoleBadge from './RoleBadge';
import { useAvatar } from '../../hooks/useAvatar';
import Avatar from '../ui/Avatar';

interface WelcomeCardProps {
  user: User;
}

export default function WelcomeCard({ user }: WelcomeCardProps) {
  // All navigation now handled in main dashboard header
  const avatar = useAvatar(user, user.id);

  return (
    <section className="welcome-section-corporate">
      <div className="welcome-card-corporate">
        {/* User Profile Section */}
        <div className="profile-section">
          <Avatar {...avatar} size="xlarge" shape="rounded" />
          
          <div className="profile-info">
            <div className="greeting">
              <span className="greeting-text">
                {new Date().getHours() < 12 ? 'Guten Morgen' : 
                 new Date().getHours() < 17 ? 'Guten Tag' : 'Guten Abend'},
              </span>
              <h2 className="user-display-name">
                {user.user_metadata?.display_name || 
                 user.user_metadata?.full_name || 
                 `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                 user.user_metadata?.username || 'Benutzer'}
              </h2>
            </div>
            
            {/* Detaillierte Benutzerinformationen */}
            <div className="user-details">
              {(user.user_metadata?.first_name || user.user_metadata?.last_name) && (
                <div className="name-section">
                  <span className="detail-label">👤 Name:</span>
                  <span className="detail-value">
                    {user.user_metadata?.first_name || ''} {user.user_metadata?.last_name || ''}
                  </span>
                </div>
              )}
              
              <div className="email-section">
                <span className="detail-label">📧 E-Mail:</span>
                <span className="detail-value">{user.email}</span>
              </div>
              
              {user.user_metadata?.username && (
                <div className="username-section">
                  <span className="detail-label">🏷️ Benutzername:</span>
                  <span className="username-badge">@{user.user_metadata.username}</span>
                </div>
              )}
              
              {user.user_metadata?.bio && (
                <div className="bio-section">
                  <span className="detail-label">📝 Bio:</span>
                  <span className="detail-value bio-text">{user.user_metadata.bio}</span>
                </div>
              )}
              
              <div className="account-info">
                <span className="detail-label">📅 Mitglied seit:</span>
                <span className="detail-value">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unbekannt'}
                </span>
              </div>
              
              <div className="verification-status">
                <span className="detail-label">✅ Status:</span>
                <span className={`verification-badge ${user.email_confirmed_at ? 'verified' : 'unverified'}`}>
                  {user.email_confirmed_at ? '🟢 Verifiziert' : '🟡 E-Mail-Bestätigung ausstehend'}
                </span>
              </div>

              {/* Role Badge - Shows user's role */}
              <RoleBadge />
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
              onClick={() => {/* TODO: Browse projects */}}
              variant="outline"
            >
              📁 Browse Projects
            </Button>
          </div>
          
          <div className="secondary-actions">
            <Button 
              onClick={() => {/* TODO: Recent activity */}}
              variant="outline"
              size="small"
            >
              � Recent Activity
            </Button>
            
            <Button 
              onClick={() => {/* TODO: Help & tutorials */}}
              variant="outline"
              size="small"
            >
              � Tutorials
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}