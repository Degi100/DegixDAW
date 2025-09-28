// src/pages/UserSettings.corporate.tsx
// Ultimate Corporate User Settings - Professional & Modern Design

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';
import { LoadingOverlay } from '../components/ui/Loading';
import Button from '../components/ui/Button';
// APP_FULL_NAME import removed as it was unused

export default function UserSettingsCorporate() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { updateProfile, updatePassword, updateEmail, deleteAccount } = useProfile(user);
  const { success, error: showError } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();

  // State management
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'account'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [emailChangeInfo, setEmailChangeInfo] = useState<{ oldEmail: string; newEmail: string } | null>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
    lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    fullName: user?.user_metadata?.full_name || '',
    username: user?.user_metadata?.username || '',
    displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
    bio: user?.user_metadata?.bio || ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: ''
  });

  // Check for email change success from URL parameters
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

  const handleThemeToggle = () => {
    toggleTheme();
    success(`${isDark ? 'Hell' : 'Dunkel'} Modus aktiviert! 🎨`);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

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
      // Automatisch Vollname aus Vor- und Nachname generieren
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      
      await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        full_name: fullName || profileData.fullName,
        display_name: profileData.displayName,
        username: profileData.username,
        bio: profileData.bio
      });
      
      // Lokale State aktualisieren
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

      {/* Main Content */}
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
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">👤 Profil Informationen</h2>
                  <p className="card-subtitle">Verwalten Sie Ihre persönlichen Informationen und Kontodaten</p>
                </div>
                
                {/* Konto-Übersicht */}
                <div className="account-overview">
                  <div className="overview-grid">
                    <div className="info-item">
                      <span className="info-label">📧 E-Mail-Adresse</span>
                      <span className="info-value">{user?.email || 'Nicht verfügbar'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">🆔 Konto-ID</span>
                      <span className="info-value">{user?.id?.substring(0, 8) || 'N/A'}...</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">📅 Registriert seit</span>
                      <span className="info-value">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">✅ E-Mail bestätigt</span>
                      <span className={`info-value ${user?.email_confirmed_at ? 'verified' : 'unverified'}`}>
                        {user?.email_confirmed_at ? '✓ Bestätigt' : '⚠️ Nicht bestätigt'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Profil-Bearbeitung */}
                <form onSubmit={handleProfileSave} className="settings-form">
                  <div className="form-section">
                    <h3 className="section-title">Persönliche Informationen</h3>
                    
                    <div className="form-grid">
                      <div className="input-group">
                        <label className="input-label">Vorname *</label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="settings-input"
                          placeholder="Ihr Vorname"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Nachname *</label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="settings-input"
                          placeholder="Ihr Nachname"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Benutzername</label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          className="settings-input"
                          placeholder="@benutzername"
                        />
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Anzeigename</label>
                        <input
                          type="text"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="settings-input"
                          placeholder="Öffentlich sichtbarer Name"
                        />
                      </div>
                      
                      <div className="input-group full-width">
                        <label className="input-label">Vollständiger Name (automatisch generiert)</label>
                        <input
                          type="text"
                          value={`${profileData.firstName} ${profileData.lastName}`.trim() || profileData.fullName}
                          className="settings-input readonly-input"
                          placeholder="Wird aus Vor- und Nachname generiert"
                          readOnly
                        />
                      </div>
                      
                      <div className="input-group full-width">
                        <label className="input-label">Biografie (optional)</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          className="settings-textarea"
                          placeholder="Erzählen Sie etwas über sich..."
                          rows={3}
                          maxLength={500}
                        />
                        <small className="char-counter">{profileData.bio.length}/500 Zeichen</small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      size="large"
                      disabled={isUpdating}
                    >
                      {isUpdating ? '⏳ Speichern...' : '✓ Profil speichern'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">🔒 Sicherheit</h2>
                  <p className="card-subtitle">Passwort und E-Mail-Adresse verwalten</p>
                </div>
                
                {/* Password Change Section */}
                <div className="settings-section">
                  <h3 className="section-title">Passwort ändern</h3>
                  <form onSubmit={handlePasswordChange} className="settings-form">
                    <div className="form-grid">
                      <div className="input-group">
                        <label className="input-label">Aktuelles Passwort *</label>
                        <input
                          type="password"
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="settings-input"
                          placeholder="Ihr aktuelles Passwort"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Neues Passwort *</label>
                        <input
                          type="password"
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="settings-input"
                          placeholder="Neues Passwort eingeben"
                          minLength={6}
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Passwort bestätigen *</label>
                        <input
                          type="password"
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="settings-input"
                          placeholder="Neues Passwort wiederholen"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isUpdating}
                      >
                        {isUpdating ? '⏳ Ändern...' : '🔑 Passwort ändern'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Email Change Section */}
                <div className="settings-section">
                  <h3 className="section-title">E-Mail-Adresse ändern</h3>
                  <form onSubmit={handleEmailChange} className="settings-form">
                    <div className="form-grid">
                      <div className="input-group">
                        <label className="input-label">Aktuelle E-Mail</label>
                        <input
                          type="email"
                          value={user.email || ''}
                          className="settings-input"
                          disabled
                        />
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Neue E-Mail-Adresse *</label>
                        <input
                          type="email"
                          value={securityData.newEmail}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, newEmail: e.target.value }))}
                          className="settings-input"
                          placeholder="neue@email.de"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label className="input-label">Passwort bestätigen *</label>
                        <input
                          type="password"
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="settings-input"
                          placeholder="Ihr aktuelles Passwort"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isUpdating}
                      >
                        {isUpdating ? '⏳ Ändern...' : '📧 E-Mail ändern'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">⚙️ Konto Verwaltung</h2>
                  <p className="card-subtitle">Session und Konto-Aktionen</p>
                </div>
                
                <div className="settings-section">
                  <h3 className="section-title">Session Verwaltung</h3>
                  <p className="section-description">
                    Aktualisieren Sie Ihre Session oder melden Sie sich ab
                  </p>
                  
                  <div className="action-buttons">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                    >
                      🔄 Session aktualisieren
                    </Button>
                    
                    <Button
                      onClick={handleLogout}
                      variant="secondary"
                    >
                      👋 Abmelden
                    </Button>
                  </div>
                </div>

                <div className="settings-section danger-section">
                  <h3 className="section-title danger">⚠️ Gefährliche Aktionen</h3>
                  <p className="section-description">
                    Diese Aktionen können nicht rückgängig gemacht werden
                  </p>
                  
                  <div className="action-buttons">
                    <Button
                      onClick={() => setShowDeleteModal(true)}
                      variant="outline"
                      className="delete-btn"
                    >
                      🗑️ Konto löschen
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">⚠️ Konto löschen</h3>
            </div>
            
            <div className="modal-content">
              <p>
                <strong>Warnung:</strong> Diese Aktion kann nicht rückgängig gemacht werden.
                Alle Ihre Daten, Projekte und Einstellungen werden permanent gelöscht.
              </p>
              
              <p>Sind Sie sich absolut sicher?</p>
            </div>
            
            <div className="modal-actions">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
              >
                Abbrechen
              </Button>
              
              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className="delete-btn"
              >
                🗑️ Konto löschen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Info Modal */}
      {showEmailInfo && emailChangeInfo && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">📧 E-Mail Änderung</h3>
            </div>
            
            <div className="modal-content">
              <p>
                Ein Bestätigungslink wurde an <strong>{emailChangeInfo.newEmail}</strong> gesendet.
              </p>
              <p>
                Bitte überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.
              </p>
            </div>
            
            <div className="modal-actions">
              <Button
                onClick={() => {
                  setShowEmailInfo(false);
                  setEmailChangeInfo(null);
                }}
                variant="primary"
              >
                Verstanden
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}