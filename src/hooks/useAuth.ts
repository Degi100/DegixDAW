// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

import { handleAuthError, type AuthError } from '../lib/authUtils';
import { getAuthCallbackUrl, getRecoveryCallbackUrl } from '../lib/urlUtils';

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
        console.log('Auth state changed:', event, session?.user?.id);
        console.log('Full session:', session);
        
        if (mounted) {
          setState({
            user: session?.user ?? null,
            loading: false,
            initialized: true
          });
        }

        // Handle sign in events
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.id);
          
          // STRICT: Always redirect new users to onboarding
          const hasUsername = session.user.user_metadata?.username;
          const needsOnboarding = session.user.user_metadata?.needs_username_onboarding;
          const isNewUser = !hasUsername || needsOnboarding;
          
          if (isNewUser) {
            console.log('New user detected - redirecting to username onboarding');
            navigate('/onboarding/username');
          } else {
            console.log('Existing user with username - staying in current flow');
          }
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
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            // NEVER set username on signup - always force onboarding
            full_name: data.fullName || '',
            display_name: data.fullName || '',
            needs_username_onboarding: true // ALWAYS trigger onboarding for new users
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