// src/pages/settings/UserSettings.corporate.tsx
// Ultimate corporate User Settings - Professional & Modern Design

import { useState } from 'react';
import { LoadingOverlay } from '../../components/ui/Loading';
import ProfileSettingsSection from '../../components/settings/ProfileSettingsSection';
import SecuritySettingsSection from '../../components/settings/SecuritySettingsSection';
import AccountSettingsSection from '../../components/settings/AccountSettingsSection';
import PrivacySettingsSection from '../../components/settings/PrivacySettingsSection';
import DeleteAccountModal from '../../components/settings/DeleteAccountModal';
import EmailChangeInfoModal from '../../components/settings/EmailChangeInfoModal';
import UserProfileModal from '../../components/profile/UserProfileModal';
import { useAuth } from '../../hooks/useAuth';
import { useProfileSection } from '../../hooks/settings/useProfileSection';
import { useSecuritySection } from '../../hooks/settings/useSecuritySection';
import { useAccountSection } from '../../hooks/settings/useAccountSection';
import { useAvatar } from '../../hooks/useAvatar';
import Avatar from '../../components/ui/Avatar';

export default function UserSettingsCorporate() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'account'>('profile');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Section hooks
  const profileSection = useProfileSection(user);
  const securitySection = useSecuritySection(user);
  const accountSection = useAccountSection(user);
  const avatar = useAvatar(user);

  if (!user) {
    return <LoadingOverlay message="Lade Benutzereinstellungen..." />;
  }

  return (
    <div className="settings-corporate">
      {/* Settings Content */}
      <main className="settings-main">
        <div className="settings-container">
          {/* Navigation Sidebar */}
          <aside className="settings-sidebar">
            <div className="sidebar-card">
              <button
                className="user-preview"
                onClick={() => setShowProfileModal(true)}
              >
                <Avatar {...avatar} size="large" shape="rounded" />
                <div className="user-info">
                  <div className="user-name">
                    {user.user_metadata?.full_name || 'Unbekannt'}
                  </div>
                  <div className="user-email">{user.email}</div>
                </div>
              </button>

              <nav className="settings-nav">
                <button
                  className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveSection('profile')}
                >
                  <span className="nav-icon">👤</span>
                  <span className="nav-text">Profil</span>
                </button>

                <button
                  className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveSection('security')}
                >
                  <span className="nav-icon">🔒</span>
                  <span className="nav-text">Sicherheit</span>
                </button>

                <button
                  className={`nav-item ${activeSection === 'account' ? 'active' : ''}`}
                  onClick={() => setActiveSection('account')}
                >
                  <span className="nav-icon">⚙️</span>
                  <span className="nav-text">Konto</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className="settings-content">
            {activeSection === 'profile' && (
              <ProfileSettingsSection
                profileData={profileSection.profileData}
                setProfileData={profileSection.setProfileData}
                isUpdating={profileSection.isUpdating}
                handleProfileSave={profileSection.handleProfileSave}
              />
            )}
            {activeSection === 'security' && (
              <>
                <SecuritySettingsSection
                  securityData={securitySection.securityData}
                  setSecurityData={securitySection.setSecurityData}
                  isUpdating={securitySection.isUpdating}
                  handlePasswordChange={securitySection.handlePasswordChange}
                  handleEmailChange={securitySection.handleEmailChange}
                  userEmail={user.email || ''}
                />
                <PrivacySettingsSection />
              </>
            )}
            {activeSection === 'account' && (
              <AccountSettingsSection handleLogout={accountSection.handleLogout} />
            )}
          </div>
        </div>
      </main>

      <DeleteAccountModal
        show={accountSection.showDeleteModal}
        onClose={() => accountSection.setShowDeleteModal(false)}
        onDelete={accountSection.handleDeleteAccount}
        isUpdating={securitySection.isUpdating || profileSection.isUpdating}
      />
      <EmailChangeInfoModal
        show={securitySection.showEmailInfo}
        info={securitySection.emailChangeInfo}
        onClose={() => {
          securitySection.setShowEmailInfo(false);
          securitySection.setEmailChangeInfo(null);
        }}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          userId={user.id}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}