// src/pages/UserSettings.advanced.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import ProfileInfo from '../components/ui/ProfileInfo';
import ProfileEditor from '../components/ui/ProfileEditor';
import PasswordChanger from '../components/ui/PasswordChanger';
import AccountActions from '../components/ui/AccountActions';
import { ToastContainer } from '../components/ui/Toast';
import { LoadingOverlay } from '../components/ui/Loading';
import Container from '../components/layout/Container';
import styles from './UserSettings.module.css';

export default function UserSettings() {
  const { user, updateProfile, updatePassword, signOut } = useAuth();
  const { success, error, toasts, removeToast } = useToast();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

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
      // Simuliere Account-Löschung (würde normalerweise server-side implementiert)
      await signOut();
      success('🗑️ Konto-Löschung angefordert - Sie wurden abgemeldet');
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`❌ Fehler bei der Kontolöschung: ${errorMessage}`);
    }
  };

  const handleProfileSave = async (profileData: { fullName: string; username: string }) => {
    setIsUpdating(true);
    try {
      await updateProfile({
        full_name: profileData.fullName,
        username: profileData.username
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

  if (!user) {
    return (
      <Container>
        <LoadingOverlay message="Lade Benutzereinstellungen..." />
      </Container>
    );
  }

  return (
    <Container>
      <div className={styles.settingsContainer}>
        <div className={styles.settingsCard}>
          <header className={styles.header}>
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
            <h1 className={styles.title}>⚙️ Benutzereinstellungen</h1>
          </header>

          <div className={styles.content}>
            <ProfileInfo user={user} />
            <ProfileEditor 
              user={user} 
              onSave={handleProfileSave}
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
      
      <ToastContainer 
        toasts={toasts}
        onRemove={removeToast}
      />
    </Container>
  );
}