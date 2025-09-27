// src/hooks/useProfile.ts
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { handleAuthError, type AuthError } from '../lib/authUtils';
import { getEmailChangeCallbackUrl } from '../lib/urlUtils';

interface ProfileUpdates {
  username?: string;
  full_name?: string;
  display_name?: string;
}

export function useProfile(user: User | null) {
  const navigate = useNavigate();

  const updateProfile = async (updates: ProfileUpdates): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      // Schreibe die Daten in die Tabelle 'profiles' (Upsert)
      const { error } = await supabase
        .from('profiles')
        .upsert([
          {
            user_id: user?.id,
            username: updates.username,
            full_name: updates.full_name
          }
        ], { onConflict: 'user_id' });

      if (error) {
        return { success: false, error: handleAuthError(error) };
      }

      // Schreibe Username auch ins Auth-Metadata, damit er in der UI angezeigt wird
      if (updates.username) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: { username: updates.username }
        });
        if (metaError) {
          return { success: false, error: handleAuthError(metaError) };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  };

  const updatePassword = async (
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      // First verify current password by trying to sign in
      if (!user?.email) {
        return { 
          success: false, 
          error: { message: 'Keine Email-Adresse gefunden', type: 'validation' } 
        };
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        return { 
          success: false, 
          error: { message: 'Aktuelles Passwort ist falsch', type: 'auth' } 
        };
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { success: false, error: handleAuthError(updateError) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      if (!user) {
        return { 
          success: false, 
          error: { message: 'Kein Benutzer angemeldet', type: 'auth' } 
        };
      }

      console.log('Attempting to delete user account:', user.id);

      // WARNUNG: Vollständige Account-Löschung erfordert Backend-Integration
      // Hier implementieren wir eine Soft-Delete-Lösung
      
      // 1. Markiere Profil als gelöscht in der Datenbank
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          username: null,
          full_name: '[GELÖSCHT]'
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Failed to mark profile as deleted:', profileError);
        return { 
          success: false, 
          error: { 
            message: 'Profil konnte nicht gelöscht werden. Bitte versuchen Sie es später erneut.', 
            type: 'auth' 
          } 
        };
      }

      // 2. Markiere Auth-User als gelöscht (falls verfügbar)
      try {
        await supabase.auth.updateUser({
          data: { 
            account_deleted: true,
            deleted_at: new Date().toISOString()
          }
        });
      } catch (metaError) {
        console.warn('Could not update auth metadata:', metaError);
        // Nicht kritisch - Profile ist bereits gelöscht
      }

      console.log('Account marked as deleted successfully');
      
      // 3. Abmelden und weiterleiten
      await supabase.auth.signOut();
      navigate('/login');
      
      return { success: true };
    } catch (error) {
      console.error('Account deletion error:', error);
      
      return { 
        success: false, 
        error: { 
          message: 'Account-Löschung fehlgeschlagen. Bitte kontaktieren Sie den Support.', 
          type: 'auth' 
        } 
      };
    }
  };

  const updateEmail = async (
    newEmail: string,
    currentPassword: string
  ): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      if (!user?.email) {
        return { 
          success: false, 
          error: { message: 'Keine Email-Adresse gefunden', type: 'validation' } 
        };
      }

      // First verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (verifyError) {
        return { 
          success: false, 
          error: { message: 'Aktuelles Passwort ist falsch', type: 'auth' } 
        };
      }

      // Update email - Supabase will send confirmation email to new address  
      const { error: updateError } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: getEmailChangeCallbackUrl() }
      );

      if (updateError) {
        return { success: false, error: handleAuthError(updateError) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  };

  return {
    updateProfile,
    updatePassword,
    updateEmail,
    deleteAccount
  };
}