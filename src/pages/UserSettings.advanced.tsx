// src/pages/UserSettings.advanced.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import EmailChangeInfo from '../components/ui/EmailChangeInfo';
import Button from '../components/ui/Button';
import ProfileInfo from '../components/profile/ProfileInfo';
import ProfileEditor from '../components/profile/ProfileEditor';
import PasswordChanger from '../components/profile/PasswordChanger';
import EmailChanger from '../components/profile/EmailChanger';
import AccountActions from '../components/profile/AccountActions';
import { LoadingOverlay } from '../components/ui/Loading';
import Container from '../components/layout/Container';

export default function UserSettings() {
  const { user, signOut } = useAuth();
  const { updateProfile, updatePassword, updateEmail, deleteAccount } = useProfile(user);
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [emailChangeInfo, setEmailChangeInfo] = useState<{ oldEmail: string; newEmail: string } | null>(null);

  // Check for email change success from URL parameters
  useEffect(() => {
    const checkEmailChangeSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const emailChangeSuccess = urlParams.get('email_changed');
      
      if (emailChangeSuccess === 'true') {
        // Force refresh session to get updated email
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
        } else {
          console.log('Session refreshed after email change');
        }
        
        // Clear the URL parameter
        window.history.replaceState({}, '', '/settings');
        
        // Show success message
        success('✅ Email-Adresse erfolgreich geändert!');
      }
    };
    
    checkEmailChangeSuccess();
  }, [success]);

  const handleRefreshSession = async () => {
    try {
      setIsUpdating(true);
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        throw refreshError;
      }
      
      success('🔄 Session erfolgreich aktualisiert!');
      // Force a page reload to show updated user data
      window.location.reload();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`❌ Fehler beim Aktualisieren: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      success('👋 Erfolgreich abgemeldet');
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`❌ Fehler beim Abmelden: ${errorMessage}`);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      '⚠️ WARNUNG: Möchten Sie Ihr Konto wirklich unwiderruflich löschen?\n\n' +
      'Diese Aktion kann nicht rückgängig gemacht werden und alle Ihre Daten werden gelöscht.\n\n' +
      'Klicken Sie "OK" nur wenn Sie sich absolut sicher sind.'
    );

    if (!confirmation) return;

    const finalConfirmation = window.confirm(
      '🚨 LETZTE WARNUNG: Ihr Konto wird PERMANENT gelöscht!\n\n' +
      'Alle Projekte, Einstellungen und Daten gehen verloren.\n\n' +
      'Klicken Sie "OK" um fortzufahren oder "Abbrechen" um abzubrechen.'
    );

    if (!finalConfirmation) return;

    try {
      // Echte Account-Löschung aus Supabase
      const result = await deleteAccount();
      
      if (result.success) {
        success('🗑️ Ihr Konto wurde erfolgreich gelöscht');
        // Navigation wird automatisch in deleteAccount() durchgeführt
      } else {
        error(`❌ Fehler bei der Kontolöschung: ${result.error?.message || 'Unbekannter Fehler'}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`❌ Fehler bei der Kontolöschung: ${errorMessage}`);
    }
  };

  const handleProfileSave = async (profileData: { fullName: string }) => {
    setIsUpdating(true);
    try {
      await updateProfile({
        full_name: profileData.fullName
      });
      success('✅ Profil erfolgreich gespeichert!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`❌ Fehler beim Speichern: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setIsUpdating(true);
    try {
      const result = await updatePassword(currentPassword, newPassword);
      
      if (result.success) {
        success('🔑 Passwort erfolgreich geändert!');
      } else {
        error(`❌ ${result.error?.message || 'Fehler beim Ändern des Passworts'}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`❌ Fehler beim Ändern des Passworts: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChange = async (newEmail: string, currentPassword: string) => {
    setIsUpdating(true);
    try {
      const result = await updateEmail(newEmail, currentPassword);
      
      if (result.success) {
        // Show detailed info about the two emails
        if (result.message) {
          // Use custom message if available
          alert(result.message);
        } else {
          // Set info for modal
          setEmailChangeInfo({ oldEmail: user?.email || '', newEmail });
          setShowEmailInfo(true);
        }
      } else {
        error(`❌ ${result.error?.message || 'Fehler beim Ändern der E-Mail-Adresse'}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`❌ Fehler beim Ändern der E-Mail-Adresse: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <LoadingOverlay message="Lade Benutzereinstellungen..." />
      </Container>
    );
  }

  return (
    <Container>
      <div className="page">
        <div className="card card-large">
          <header className="page-header">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zurück-Button geklickt, navigiere zu /');
                try {
                  navigate('/');
                  console.log('Navigation erfolgreich');
                } catch (navigationError) {
                  console.error('Navigation fehlgeschlagen:', navigationError);
                  window.location.href = '/';
                }
              }}
              variant="outline"
              size="small"
              type="button"
            >
              ← Zurück zum Dashboard
            </Button>
            <h1 className="page-title">⚙️ Benutzereinstellungen</h1>
            
            <Button
              onClick={handleRefreshSession}
              variant="secondary"
              size="small"
              disabled={isUpdating}
              type="button"
            >
              🔄 Session aktualisieren
            </Button>
          </header>

          <div className="main-content">
            <ProfileInfo user={user} />
            <ProfileEditor 
              user={user} 
              onSave={handleProfileSave}
              isUpdating={isUpdating}
            />
            <EmailChanger
              currentEmail={user.email || ''}
              onChangeEmail={handleEmailChange}
              isUpdating={isUpdating}
            />
            <PasswordChanger 
              onChangePassword={handlePasswordChange}
              isUpdating={isUpdating}
            />
            <AccountActions 
              onLogout={handleLogout}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        </div>
      </div>
      
      {/* Email Change Info Modal */}
      {showEmailInfo && emailChangeInfo && (
        <EmailChangeInfo
          oldEmail={emailChangeInfo.oldEmail}
          newEmail={emailChangeInfo.newEmail}
          onClose={() => {
            setShowEmailInfo(false);
            setEmailChangeInfo(null);
          }}
        />
      )}
      
    </Container>
  );
}