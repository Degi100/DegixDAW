import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useProfile } from '../useProfile';
import { useToast } from '../useToast';
import { supabase } from '../../lib/supabase';
import type { SecurityDataState, EmailChangeInfo } from '../../components/settings/types/settings';

export function useSecuritySection(user: User | null) {
  const { updatePassword, updateEmail } = useProfile(user);
  const { success, error: showError } = useToast();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [emailChangeInfo, setEmailChangeInfo] = useState<EmailChangeInfo | null>(null);
  const [securityData, setSecurityData] = useState<SecurityDataState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: ''
  });

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

  return {
    securityData,
    setSecurityData,
    isUpdating,
    showEmailInfo,
    setShowEmailInfo,
    emailChangeInfo,
    setEmailChangeInfo,
    handlePasswordChange,
    handleEmailChange
  };
}
