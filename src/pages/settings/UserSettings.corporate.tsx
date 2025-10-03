// src/pages/settings/UserSettings.corporate.tsx
// Ultimate Corporate User Settings - Professional & Modern Design

import { useState, useEffect } from 'react';
import { LoadingOverlay } from '../../components/ui/Loading';
import Header from '../../components/layout/Header';
import ProfileSettingsSection from '../../components/settings/ProfileSettingsSection';
import SecuritySettingsSection from '../../components/settings/SecuritySettingsSection';
import AccountSettingsSection from '../../components/settings/AccountSettingsSection';
import DeleteAccountModal from '../../components/settings/DeleteAccountModal';
import EmailChangeInfoModal from '../../components/settings/EmailChangeInfoModal';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import type {
  ProfileDataState,
  SecurityDataState,
  EmailChangeInfo
} from '../../components/settings/types/settings';

export default function UserSettingsCorporate() {
  const { user, signOut } = useAuth();
  const { updateProfile, updatePassword, updateEmail, deleteAccount } = useProfile(user);
  const { success, error: showError } = useToast();

  // State management
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'account'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [emailChangeInfo, setEmailChangeInfo] = useState<EmailChangeInfo | null>(null);

  // Form states
  const [profileData, setProfileData] = useState<ProfileDataState>({
    firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
    lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    fullName: user?.user_metadata?.full_name || '',
    username: user?.user_metadata?.username || '',
    displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
    bio: user?.user_metadata?.bio || ''
  });

  const [securityData, setSecurityData] = useState<SecurityDataState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: ''
  });

  // Load profile data from database on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.warn('Error loading profile data:', error);
          return;
        }

        if (profile) {
          setProfileData({
            firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            fullName: profile.full_name || user?.user_metadata?.full_name || '',
            username: profile.username || user?.user_metadata?.username || '',
            displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
            bio: user?.user_metadata?.bio || ''
          });
        }
      } catch (err) {
        console.warn('Error loading profile data:', err);
      }
    };

    loadProfileData();
  }, [user?.id, user?.user_metadata]);

  // Aktualisiere die Felder automatisch, wenn sich das User-Objekt ändert
  useEffect(() => {
    // Only update if we don't have profile data from database yet
    if (!profileData.username && !profileData.fullName) {
      setProfileData({
        firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
        lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        fullName: user?.user_metadata?.full_name || '',
        username: user?.user_metadata?.username || '',
        displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
        bio: user?.user_metadata?.bio || ''
      });
    }
  }, [user, profileData.username, profileData.fullName]);

  // Check for email change success
  useEffect(() => {
    const checkEmailChangeSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const emailChangeSuccess = urlParams.get('email_changed');
      if (emailChangeSuccess === 'true') {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
        }
        window.history.replaceState({}, '', '/settings');
        success('E-Mail-Adresse erfolgreich geändert! ✅');
      }
    };
    checkEmailChangeSuccess();
  }, [success]);

  // Handlers
  const handleLogout = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        success('Erfolgreich abgemeldet! 👋');
      } else {
        showError(result.error?.message || 'Abmeldung fehlgeschlagen');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Abmeldung fehlgeschlagen: ${errorMessage}`);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      await updateProfile({
        full_name: fullName || profileData.fullName,
        username: profileData.username
      });
      setProfileData(prev => ({ ...prev, fullName: fullName || prev.fullName }));
      success('Profil erfolgreich gespeichert! ✅');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Fehler beim Speichern: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      showError('Passwörter stimmen nicht überein');
      return;
    }
    if (securityData.newPassword.length < 6) {
      showError('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    setIsUpdating(true);
    try {
      const result = await updatePassword(securityData.currentPassword, securityData.newPassword);
      if (result.success) {
        success('Passwort erfolgreich geändert! 🔑');
        setSecurityData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        showError(result.error?.message || 'Fehler beim Ändern des Passworts');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Fehler beim Ändern des Passworts: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityData.newEmail || !securityData.currentPassword) {
      showError('Bitte geben Sie die neue E-Mail und Ihr aktuelles Passwort ein');
      return;
    }
    setIsUpdating(true);
    try {
      const result = await updateEmail(securityData.newEmail, securityData.currentPassword);
      if (result.success) {
        setEmailChangeInfo({ oldEmail: user?.email || '', newEmail: securityData.newEmail });
        setShowEmailInfo(true);
        setSecurityData(prev => ({ ...prev, newEmail: '', currentPassword: '' }));
      } else {
        showError(result.error?.message || 'Fehler beim Ändern der E-Mail-Adresse');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Fehler beim Ändern der E-Mail-Adresse: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteAccount();
      if (result.success) {
        success('Konto erfolgreich gelöscht 🗑️');
      } else {
        showError(result.error?.message || 'Fehler bei der Kontolöschung');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Fehler bei der Kontolöschung: ${errorMessage}`);
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return <LoadingOverlay message="Lade Benutzereinstellungen..." />;
  }

  return (
    <div className="settings-corporate">
      <Header />

      {/* Settings Content */}
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
              <AccountSettingsSection handleLogout={handleLogout} />
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