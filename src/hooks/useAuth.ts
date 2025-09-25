// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}

interface AuthError {
  message: string;
  type: 'auth' | 'rate_limit' | 'validation' | 'network';
}

export function useAuth() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setState({
            user: session?.user ?? null,
            loading: false,
            initialized: true
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setState({
            user: null,
            loading: false,
            initialized: true
          });
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user ?? null,
            loading: false
          }));

          // Handle different auth events
          if (event === 'SIGNED_IN') {
            console.log('User signed in:', session?.user?.email);
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const generateUsername = (fullName: string, email: string): string => {
    if (fullName.trim()) {
      return fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    const emailName = email.split('@')[0];
    return emailName.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const handleAuthError = (error: unknown): AuthError => {
    const message = (error instanceof Error ? error.message : String(error)) || 'Ein unbekannter Fehler ist aufgetreten';
    
    if (message.includes('429') || message.includes('rate')) {
      return {
        message: 'Zu viele Versuche. Bitte warten Sie einige Minuten.',
        type: 'rate_limit'
      };
    }
    
    if (message.includes('Invalid login credentials')) {
      return {
        message: 'Ungültige Anmeldedaten. Bitte überprüfen Sie Email und Passwort.',
        type: 'auth'
      };
    }
    
    if (message.includes('already registered')) {
      return {
        message: 'Diese Email ist bereits registriert.',
        type: 'validation'
      };
    }
    
    if (message.includes('Email not confirmed')) {
      return {
        message: 'Bitte bestätigen Sie Ihre Email-Adresse.',
        type: 'validation'
      };
    }

    return {
      message,
      type: 'auth'
    };
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: handleAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  };

  const signUpWithEmail = async (data: SignUpData): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const finalUsername = data.username?.trim() || generateUsername(data.fullName || '', data.email);
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: 'http://localhost:5173/auth/callback',
          data: {
            username: finalUsername,
            full_name: data.fullName?.trim() || null,
            display_name: data.fullName?.trim() || finalUsername
          }
        }
      });

      if (error) {
        return { success: false, error: handleAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'discord'): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'http://localhost:5173/auth/callback',
        },
      });

      if (error) {
        return { success: false, error: handleAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: handleAuthError(error) };
      }

      navigate('/login');
      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  };

  const updateProfile = async (updates: {
    username?: string;
    full_name?: string;
    display_name?: string;
  }): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        return { success: false, error: handleAuthError(error) };
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
      if (!state.user?.email) {
        return { 
          success: false, 
          error: { message: 'Keine Email-Adresse gefunden', type: 'validation' } 
        };
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: state.user.email,
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

  return {
    // State
    user: state.user,
    loading: state.loading,
    initialized: state.initialized,
    isAuthenticated: !!state.user,
    
    // Actions
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    updateProfile,
    updatePassword,
    
    // Utilities
    displayName: state.user?.user_metadata?.display_name || 
                 state.user?.user_metadata?.username || 
                 state.user?.email || 'Benutzer',
    username: state.user?.user_metadata?.username || '',
    fullName: state.user?.user_metadata?.full_name || '',
  };
}