// src/lib/auth/onboardingCheck.ts
// Pure function for checking if user needs onboarding after sign in

import type { User } from '@supabase/supabase-js';
import type { NavigateFunction } from 'react-router-dom';
import { supabase } from '../supabase';

/**
 * Checks if a user needs to complete onboarding (username selection)
 * Called after successful sign in to redirect new users to onboarding flow
 * 
 * @param user - The authenticated Supabase user
 * @param navigate - React Router navigate function
 * @param isInitialSignIn - Whether this is an actual sign-in event (not just navigation)
 */
export async function checkUserOnboarding(
  user: User, 
  navigate: NavigateFunction,
  isInitialSignIn: boolean = false
): Promise<void> {
  console.log('Checking onboarding for user:', user.id, 'isInitialSignIn:', isInitialSignIn);

  // Skip onboarding check if user is already navigating within the app
  // UNLESS this is an actual initial sign-in event
  const isInAppNavigation = 
    window.location.pathname.startsWith('/dashboard') ||
    window.location.pathname.startsWith('/settings') ||
    window.location.pathname.startsWith('/admin') ||
    window.location.pathname.startsWith('/profile') ||
    window.location.pathname.startsWith('/social') ||
    window.location.pathname.startsWith('/chat');

  if (isInAppNavigation && !isInitialSignIn) {
    // User is already in the app and this isn't an initial sign-in - don't trigger onboarding
    console.log('User in app navigation (not initial sign-in) - skipping onboarding check');
    return;
  }

  // Check if user needs onboarding via metadata
  const needsOnboarding = user.user_metadata?.needs_username_onboarding !== false;

  if (!needsOnboarding) {
    console.log('User is already onboarded (metadata check)');
    return;
  }

  // User metadata says needs onboarding - verify with profile check
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (error) {
      // Profile query failed - assume needs onboarding for safety
      console.warn('Error checking profile for onboarding:', error);
      navigate('/onboarding/username');
      return;
    }

    if (!profile) {
      // No profile found - user needs onboarding
      console.log('User needs onboarding: no profile found');
      navigate('/onboarding/username');
      return;
    }

    // Profile exists but metadata says needs onboarding
    // This shouldn't happen - fix the metadata
    console.log('User has profile but metadata says needs onboarding - fixing metadata');
    await supabase.auth.updateUser({
      data: { needs_username_onboarding: false }
    });

  } catch (error) {
    // Unexpected error - assume needs onboarding for safety
    console.warn('Unexpected error in onboarding check:', error);
    navigate('/onboarding/username');
  }
}
