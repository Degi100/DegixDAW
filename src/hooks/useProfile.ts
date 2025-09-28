// src/hooks/useProfile.ts
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { handleAuthError, type AuthError, type AuthResult } from '../lib/authUtils';
import { getEmailChangeCallbackUrl } from '../lib/urlUtils';

interface ProfileUpdates {
  username?: string;
  full_name?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
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
            full_name: updates.full_name,
            first_name: updates.first_name,
            last_name: updates.last_name,
            bio: updates.bio
          }
        ], { onConflict: 'user_id' });

      if (error) {
        return { success: false, error: handleAuthError(error) };
      }

      // Aktualisiere auch die Auth-Metadata für alle relevanten Felder
      const metadataUpdates: Record<string, unknown> = {};
      if (updates.username) metadataUpdates.username = updates.username;
      if (updates.full_name) metadataUpdates.full_name = updates.full_name;
      if (updates.display_name) metadataUpdates.display_name = updates.display_name;
      if (updates.first_name) metadataUpdates.first_name = updates.first_name;
      if (updates.last_name) metadataUpdates.last_name = updates.last_name;
      if (updates.bio) metadataUpdates.bio = updates.bio;
      
      if (Object.keys(metadataUpdates).length > 0) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: metadataUpdates
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
      } catch {

        // Nicht kritisch - Profile ist bereits gelöscht
      }


      
      // 3. Abmelden und weiterleiten
      await supabase.auth.signOut();
  navigate('/dashboard');
      
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
  ): Promise<AuthResult> => {
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

      return { 
        success: true, 
        message: `Email-Änderung initiiert!\n\nSie erhalten 2 Bestätigungs-E-Mails:\n• An Ihre alte E-Mail (${user.email}) - zur Sicherheit\n• An Ihre neue E-Mail (${newEmail}) - zur Bestätigung\n\nKlicken Sie den Link in der E-Mail an Ihre NEUE Adresse!`
      };
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