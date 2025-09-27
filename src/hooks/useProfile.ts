// src/hooks/useProfile.ts
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { handleAuthError, type AuthError } from '../lib/authUtils';

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

      // Create a service role client for user deletion
      // Note: This would typically require a backend endpoint with service role key
      // For client-side, we'll use a more practical approach
      
      // First, try to update the user to mark as deleted
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          account_deleted: true,
          deleted_at: new Date().toISOString()
        }
      });

      if (updateError) {
        console.error('Failed to mark account as deleted:', updateError);
        return { 
          success: false, 
          error: { 
            message: 'Account-Löschung fehlgeschlagen. Bitte versuchen Sie es später erneut.', 
            type: 'auth' 
          } 
        };
      }

      console.log('Account marked as deleted successfully');
      
      // Sign out and redirect after marking as deleted
      await supabase.auth.signOut();
      navigate('/login');
      
      return { success: true };
    } catch (error) {
      console.error('Account deletion error:', error);
      
      return { 
        success: false, 
        error: { 
          message: 'Account-Löschung fehlgeschlagen. Bitte versuchen Sie es später erneut.', 
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
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      });

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