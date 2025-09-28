// src/pages/UserSettings.corporate.tsx
// Ultimate Corporate User Settings - Professional & Modern Design

import { LoadingOverlay } from '../components/ui/Loading';
import Button from '../components/ui/Button';
import ProfileSettingsSection from '../components/settings/ProfileSettingsSection';
import SecuritySettingsSection from '../components/settings/SecuritySettingsSection';
import AccountSettingsSection from '../components/settings/AccountSettingsSection';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';
import EmailChangeInfoModal from '../components/settings/EmailChangeInfoModal';
import { useUserSettings } from '../hooks/useUserSettings';

export default function UserSettingsCorporate() {
  const {
    user,
    isAdmin,
    isDark,
    activeSection,
    setActiveSection,
    isUpdating,
    showDeleteModal,
    setShowDeleteModal,
    showEmailInfo,
    setShowEmailInfo,
    emailChangeInfo,
    setEmailChangeInfo,
    profileData,
    setProfileData,
    securityData,
    setSecurityData,
    handleThemeToggle,
    handleBackToDashboard,
    handleLogout,
    handleProfileSave,
    handlePasswordChange,
    handleEmailChange,
    handleDeleteAccount,
    navigate
  } = useUserSettings();

  if (!user) {
    return <LoadingOverlay message="Lade Benutzereinstellungen..." />;
  }

  return (
    <div className="settings-corporate">
      {/* Corporate Header */}
      <header className="settings-header">
        <div className="header-content">
          <div className="header-main">
            <div className="brand-section">
              <h1 className="brand-title">⚙️ Einstellungen</h1>
              <p className="brand-subtitle">
                Verwalten Sie Ihr Profil und Ihre Kontosicherheit
              </p>
            </div>
            
            <div className="header-actions">
              <Button
                onClick={handleThemeToggle}
                variant="outline"
                size="small"
                className="theme-toggle-btn"
                title={isDark ? 'Hell Modus' : 'Dunkel Modus'}
              >
                {isDark ? '☀️' : '🌙'}
              </Button>

              {isAdmin && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="success"
                  size="small"
                >
                  🛡️ Admin
                </Button>
              )}
              
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                size="small"
              >
                ← Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="settings-main">
        <div className="settings-container">
          {/* Navigation Sidebar */}
          <aside className="settings-sidebar">
            <div className="sidebar-card">
              <div className="user-preview">
                <div className="user-avatar">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {user.user_metadata?.full_name || 'Unbekannt'}
                  </div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              
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
                profileData={profileData}
                setProfileData={setProfileData}
                isUpdating={isUpdating}
                handleProfileSave={handleProfileSave}
              />
            )}
            {activeSection === 'security' && (
              <SecuritySettingsSection
                securityData={securityData}
                setSecurityData={setSecurityData}
                isUpdating={isUpdating}
                handlePasswordChange={handlePasswordChange}
                handleEmailChange={handleEmailChange}
                userEmail={user.email || ''}
              />
            )}
            {activeSection === 'account' && (
              <AccountSettingsSection
                handleLogout={handleLogout}
                isUpdating={isUpdating}
              />
            )}
          </div>
        </div>
      </main>

      <DeleteAccountModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteAccount}
        isUpdating={isUpdating}
      />
      <EmailChangeInfoModal
        show={showEmailInfo}
        info={emailChangeInfo}
        onClose={() => {
          setShowEmailInfo(false);
          setEmailChangeInfo(null);
        }}
      />
    </div>
  );
}