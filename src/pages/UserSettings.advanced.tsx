// src/pages/UserSettings.advanced.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import UsernameSuggestions from '../components/ui/UsernameSuggestions';
import { ToastContainer } from '../components/ui/Toast';
import { LoadingOverlay, Spinner } from '../components/ui/Loading';
import Container from '../components/layout/Container';
import { userSettingsWithPasswordSchema, validateUserSettingsAsync } from '../lib/validation';
import styles from './UserSettings.module.css';

export default function UserSettings() {
  const navigate = useNavigate();
  const { user, loading, updateProfile, updatePassword, signOut } = useAuth();
  const { success, error: showError, toasts, removeToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false);

  const form = useForm({
    schema: userSettingsWithPasswordSchema,
    initialValues: {
      fullName: user?.user_metadata?.full_name || '',
      username: user?.user_metadata?.username || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    onSubmit: async (data) => {
      setIsUpdating(true);
      try {
        // Update profile information
        const profileData = {
          full_name: data.fullName,
          username: data.username
        };
        
        const profileResult = await updateProfile(profileData);
        
        if (!profileResult.success) {
          showError(profileResult.error?.message || 'Profil-Update fehlgeschlagen');
          return;
        }

        // Update password if provided
        if (data.newPassword && data.currentPassword) {
          const passwordResult = await updatePassword(data.currentPassword, data.newPassword);
          
          if (!passwordResult.success) {
            showError(passwordResult.error?.message || 'Passwort-Update fehlgeschlagen');
            return;
          }
          
          success('Profil und Passwort erfolgreich aktualisiert!');
        } else {
          success('Profil erfolgreich aktualisiert!');
        }
        
        // Clear password fields
        form.setValue('currentPassword', '');
        form.setValue('newPassword', '');
        form.setValue('confirmPassword', '');
        
      } catch (error) {
        console.error('Settings update error:', error);
        showError('Ein unerwarteter Fehler ist aufgetreten');
      } finally {
        setIsUpdating(false);
      }
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Debounced validation für aktuelles Passwort
  useEffect(() => {
    if (!form.values.currentPassword || form.values.currentPassword.length < 3) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const result = await validateUserSettingsAsync({
          ...form.values,
          fullName: form.values.fullName,
          username: form.values.username,
          currentPassword: form.values.currentPassword,
          newPassword: form.values.newPassword,
          confirmPassword: form.values.confirmPassword
        });

        const errors = result.errors as Record<string, string>;
        if (!result.success && errors.currentPassword) {
          form.setFieldError('currentPassword', errors.currentPassword);
        } else if (result.success) {
          // Lössche Fehler wenn Passwort korrekt ist
          if (form.errors.currentPassword) {
            form.setFieldError('currentPassword', '');
          }
        }
      } catch (error) {
        console.error('Fehler bei Passwort-Validierung:', error);
      }
    }, 1000); // 1 Sekunde Debounce

    return () => clearTimeout(timeoutId);
  }, [form.values.currentPassword, form]);

  // Initialize form values when user data loads
  useEffect(() => {
    if (user) {
      const currentFullName = form.values.fullName;
      const currentUsername = form.values.username;
      const newFullName = user.user_metadata?.full_name || '';
      const newUsername = user.user_metadata?.username || '';
      
      // Only update if values actually changed to prevent loops
      if (currentFullName !== newFullName) {
        form.setValue('fullName', newFullName);
      }
      if (currentUsername !== newUsername) {
        form.setValue('username', newUsername);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Explicitly ignoring form dependency to prevent infinite loop

  // Show username suggestions when user starts editing username
  useEffect(() => {
    const currentUsername = user?.user_metadata?.username || '';
    const newUsername = form.values.username;
    const fullName = form.values.fullName;
    
    // Show suggestions if:
    // 1. Username is being changed and has at least 2 characters, OR
    // 2. Full name has at least 2 characters
    const hasUsernameChange = newUsername && newUsername !== currentUsername && newUsername.length >= 2;
    const hasFullName = fullName && fullName.length >= 2;
    
    if (hasUsernameChange || hasFullName) {
      setShowUsernameSuggestions(true);
    } else {
      setShowUsernameSuggestions(false);
    }
  }, [form.values.username, form.values.fullName, user]);

  const handleUsernameSelect = (username: string) => {
    form.setValue('username', username);
    setShowUsernameSuggestions(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
    );
    
    if (!confirmed) return;

    try {
      // Note: Account deletion would need to be implemented on the backend
      showError('Konto-Löschung ist noch nicht implementiert. Kontaktieren Sie den Support.');
    } catch {
      showError('Fehler beim Löschen des Kontos');
    }
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      success('Erfolgreich abgemeldet!');
      navigate('/login');
    }
  };

  if (loading) {
    return <LoadingOverlay message="Lädt Benutzereinstellungen..." />;
  }

  if (!user) {
    return null;
  }

  const hasPasswordFields = form.values.currentPassword || form.values.newPassword || form.values.confirmPassword;

  return (
    <>
      <Container>
        <div className={styles.settings}>
          <header className={styles.header}>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zurück-Button geklickt, navigiere zu /');
                try {
                  navigate('/');
                  console.log('Navigation erfolgreich');
                } catch (error) {
                  console.error('Navigation fehlgeschlagen:', error);
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
            {/* Account Info Card */}
            <section className={styles.infoCard}>
              <div className={styles.accountInfo}>
                <div className={styles.avatar}>
                  <span className={styles.avatarText}>
                    {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.accountDetails}>
                  <h2 className={styles.accountName}>
                    {user.user_metadata?.full_name || 'Unbenannter Benutzer'}
                  </h2>
                  <p className={styles.accountEmail}>{user.email}</p>
                  {user.user_metadata?.username && (
                    <p className={styles.accountUsername}>@{user.user_metadata.username}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Profile Form */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>📝 Profil-Informationen</h2>
              
              <form onSubmit={form.handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <Input
                    {...form.getFieldProps('fullName')}
                    type="text"
                    placeholder="Vollständiger Name"
                    required
                    showCheckmark
                    helpText="Wird als Anzeigename verwendet"
                  />
                </div>

                <div className={styles.formRow}>
                  <Input
                    {...form.getFieldProps('username')}
                    type="text"
                    placeholder="Benutzername"
                    required
                    showCheckmark
                    helpText="Eindeutiger Benutzername für Ihr Profil"
                  />
                  {showUsernameSuggestions && (
                    <UsernameSuggestions
                      fullName={form.values.fullName}
                      currentUsername={form.values.username}
                      onSelectUsername={handleUsernameSelect}
                      show={showUsernameSuggestions}
                    />
                  )}
                </div>

                <div className={styles.emailField}>
                  <label className={styles.label}>Email-Adresse</label>
                  <div className={styles.emailDisplay}>
                    <span className={styles.emailValue}>{user.email}</span>
                    <small className={styles.emailNote}>
                      📧 Email-Änderungen sind derzeit nicht verfügbar
                    </small>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating}
                  variant="primary"
                  fullWidth
                >
                  {isUpdating ? (
                    <>
                      <Spinner size="small" />
                      Speichert...
                    </>
                  ) : (
                    '💾 Profil speichern'
                  )}
                </Button>
              </form>
            </section>

            {/* Password Change */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>🔐 Passwort ändern</h2>
              
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <Input
                    {...form.getFieldProps('currentPassword')}
                    type="password"
                    placeholder="Aktuelles Passwort"
                    showPasswordToggle
                    showCheckmark
                    conditionalRequired={!!hasPasswordFields}
                  />
                </div>

                <div className={styles.formRow}>
                  <Input
                    {...form.getFieldProps('newPassword')}
                    type="password"
                    placeholder="Neues Passwort"
                    helpText="Mindestens 6 Zeichen, mit Groß-/Kleinbuchstaben und Zahl"
                    showPasswordToggle
                    showCheckmark
                    conditionalRequired={!!hasPasswordFields}
                  />
                </div>

                <div className={styles.formRow}>
                  <Input
                    {...form.getFieldProps('confirmPassword')}
                    type="password"
                    placeholder="Neues Passwort bestätigen"
                    showPasswordToggle
                    showCheckmark
                    conditionalRequired={!!hasPasswordFields}
                  />
                </div>

                {hasPasswordFields && (
                  <Button
                    onClick={form.handleSubmit}
                    disabled={isUpdating || !form.values.currentPassword || !form.values.newPassword}
                    variant="secondary"
                    fullWidth
                  >
                    {isUpdating ? (
                      <>
                        <Spinner size="small" />
                        Ändert...
                      </>
                    ) : (
                      '🔑 Passwort ändern'
                    )}
                  </Button>
                )}
              </div>
            </section>

            {/* Account Actions */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>⚠️ Konto-Aktionen</h2>
              
              <div className={styles.dangerZone}>
                <p className={styles.dangerDescription}>
                  Vorsichtsmaßnahmen für Ihr Konto
                </p>
                
                <div className={styles.actionButtons}>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    fullWidth
                  >
                    👋 Von diesem Gerät abmelden
                  </Button>
                  
                  <Button
                    onClick={handleDeleteAccount}
                    variant="error"
                    fullWidth
                  >
                    🗑️ Konto dauerhaft löschen
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}