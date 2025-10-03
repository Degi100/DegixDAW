// src/lib/profile/profileActions.ts
// Pure functions for profile operations - NO HOOKS!

import type { NavigateFunction } from 'react-router-dom';
import { supabase } from '../supabase';
import { handleAuthError, type AuthError, type AuthResult } from '../authUtils';
import { getEmailChangeCallbackUrl } from '../urlUtils';

export interface ProfileUpdates {
  username?: string;
  full_name?: string;
}

/**
 * Updates user profile in both profiles table and auth metadata
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdates
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    // Schreibe die Daten in die Tabelle 'profiles' (Upsert)
    // NUR die Spalten verwenden, die tatsächlich in der DB existieren
    const profileData = {
      user_id: userId,
      username: updates.username,
      full_name: updates.full_name
    };

    const { error } = await supabase
      .from('profiles')
      .upsert([profileData], { onConflict: 'user_id' });

    if (error) {
      return { success: false, error: handleAuthError(error) };
    }

    // Aktualisiere auch die Auth-Metadata für alle relevanten Felder
    const metadataUpdates: Record<string, unknown> = {};
    if (updates.username) metadataUpdates.username = updates.username;
    if (updates.full_name) metadataUpdates.full_name = updates.full_name;
    
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
}

/**
 * Updates user password after verifying current password
 */
export async function updatePassword(
  userEmail: string,
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    // First verify current password by trying to sign in
    if (!userEmail) {
      return { 
        success: false, 
        error: { message: 'Keine Email-Adresse gefunden', type: 'validation' } 
      };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userEmail,
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
}

/**
 * Updates user email after verifying current password
 * Sends confirmation emails to both old and new addresses
 */
export async function updateEmail(
  userEmail: string,
  newEmail: string,
  currentPassword: string
): Promise<AuthResult> {
  try {
    if (!userEmail) {
      return { 
        success: false, 
        error: { message: 'Keine Email-Adresse gefunden', type: 'validation' } 
      };
    }

    // First verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: userEmail,
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
      message: `Email-Änderung initiiert!\n\nSie erhalten 2 Bestätigungs-E-Mails:\n• An Ihre alte E-Mail (${userEmail}) - zur Sicherheit\n• An Ihre neue E-Mail (${newEmail}) - zur Bestätigung\n\nKlicken Sie den Link in der E-Mail an Ihre NEUE Adresse!`
    };
  } catch (error) {
    return { success: false, error: handleAuthError(error) };
  }
}

/**
 * Soft-deletes user account by marking profile as deleted
 * Then signs out and redirects to dashboard
 */
export async function deleteAccount(
  userId: string,
  navigate: NavigateFunction
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    if (!userId) {
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
      .eq('user_id', userId);

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
}
