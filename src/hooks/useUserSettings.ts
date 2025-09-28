import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';
import type {
  ProfileDataState,
  SecurityDataState,
  EmailChangeInfo
} from '../components/settings/types/settings';

export function useUserSettings() {
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
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        full_name: fullName || profileData.fullName,
        display_name: profileData.displayName,
        username: profileData.username,
        bio: profileData.bio
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

  return {
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
  };
}
