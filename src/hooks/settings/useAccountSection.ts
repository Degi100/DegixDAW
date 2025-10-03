import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '../useAuth';
import { useProfile } from '../useProfile';
import { useToast } from '../useToast';

export function useAccountSection(user: User | null) {
  const { signOut } = useAuth();
  const { deleteAccount } = useProfile(user);
  const { success, error: showError } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    showDeleteModal,
    setShowDeleteModal,
    handleLogout,
    handleDeleteAccount
  };
}
