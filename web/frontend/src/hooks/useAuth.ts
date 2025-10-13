// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { handleAuthError, type AuthError } from '../lib/authUtils';
import { getAuthCallbackUrl, getRecoveryCallbackUrl } from '../lib/urlUtils';
import { checkUserOnboarding } from '../lib/auth/onboardingCheck';

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
  firstName?: string;
  lastName?: string;
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
    let isInitialLoad = true;

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
        // Skip initial load event to prevent unnecessary checks
        if (isInitialLoad) {
          isInitialLoad = false;
          return;
        }

        if (mounted) {
          setState({
            user: session?.user ?? null,
            loading: false,
            initialized: true
          });
        }

        // Only check onboarding on actual SIGNED_IN events (not TOKEN_REFRESHED or INITIAL_SESSION)
        if (event === 'SIGNED_IN' && session?.user) {
          // Pass true to indicate this is an actual sign-in event
          await checkUserOnboarding(session.user, navigate, true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
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
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            // NEVER set username on signup - always force onboarding
            full_name: data.fullName || '',
            first_name: data.firstName || '',
            last_name: data.lastName || '',
            display_name: data.fullName || '',
            needs_username_onboarding: true // ALWAYS trigger onboarding for new users
          }
        }
      });

      if (error) {
        return { success: false, error: handleAuthError(error) };
      }

      // Automatically create profile for new user
      if (signUpData.user) {
        try {
          const emailPrefix = data.email.split('@')[0];
          const userIdShort = signUpData.user.id.substring(0, 6);
          
          await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: data.fullName || emailPrefix,
            username: `${emailPrefix}_${userIdShort}`,
            created_at: new Date().toISOString()
          });
          
          console.log('Profile created automatically for new user');
        } catch (profileError) {
          console.warn('Profile creation failed (will be handled by onboarding):', profileError);
          // Don't fail signup if profile creation fails - onboarding will handle it
        }
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
          redirectTo: getAuthCallbackUrl()
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

  const signOut = async (): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      // Update state immediately to show user is being signed out
      setState(prev => ({ ...prev, loading: true }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        // Restore previous state if sign out failed
        setState(prev => ({ ...prev, loading: false }));
        return { success: false, error: handleAuthError(error) };
      }

      // Clear user state immediately
      setState({
        user: null,
        loading: false,
        initialized: true
      });

      // Navigate to login page
      navigate('/welcome');
      return { success: true };
    } catch (error) {
      // Restore previous state if sign out failed
      setState(prev => ({ ...prev, loading: false }));
      return { success: false, error: handleAuthError(error) };
    }
  };

  const resendConfirmation = async (email: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: getAuthCallbackUrl()
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

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRecoveryCallbackUrl()
      });

      if (error) {
        return { success: false, error: handleAuthError(error) };
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
    resendConfirmation,
    resetPassword,

    // Utilities
    displayName: state.user?.user_metadata?.display_name ||
                 state.user?.user_metadata?.username ||
                 state.user?.email || 'Benutzer',
    username: state.user?.user_metadata?.username || '',
    fullName: state.user?.user_metadata?.full_name || '',
  };
}