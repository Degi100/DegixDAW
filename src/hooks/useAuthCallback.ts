import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
// import { useToast } from '../hooks/useToast'; // Optional: Toast-System

export function useAuthCallback() {
  const navigate = useNavigate();
  // const { success, error: showError } = useToast(); // Optional

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const emailToken = urlParams.get('token');
        const emailType = urlParams.get('type');
        const error_code = urlParams.get('error_code') || hashParams.get('error_code');
        const error_description = urlParams.get('error_description') || hashParams.get('error_description');

        if (error_code === 'otp_expired' || error_description?.includes('expired')) {
          navigate('/auth/resend-confirmation');
          return;
        }

        if (accessToken && refreshToken) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('OAuth-Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
            navigate('/login');
          } else if (session?.user) {
            const user = session.user;
            
            // Check if user needs onboarding (no profile = needs onboarding)
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('user_id', user.id)
                .single();
              
              if (!profile) {
                // No profile found - user needs onboarding
                navigate('/onboarding/username');
              } else {
                // Profile exists - user is already onboarded
                navigate('/dashboard');
              }
            } catch (error) {
              console.warn('Error checking profile for onboarding:', error);
              // If we can't check the profile, assume user needs onboarding for safety
              navigate('/onboarding/username');
            }
          } else {
            navigate('/login');
          }
        }
        else if (emailToken && emailType) {
          if (emailType === 'recovery') {
            navigate(`/auth/recover?token=${emailToken}&email=${urlParams.get('email') || ''}`);
            return;
          }
          if (emailType === 'email_change') {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: emailToken,
              type: 'email_change'
            });
            if (error) {
              console.warn('Email-Änderung fehlgeschlagen. Bitte versuchen Sie es erneut.');
              navigate('/settings');
              return;
            }
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
              console.info('Email-Adresse erfolgreich geändert! Aus Sicherheitsgründen wurden Sie abgemeldet.');
              navigate('/login');
              return;
            }
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.info('Email-Adresse geändert! Bitte loggen Sie sich mit Ihrer neuen Email-Adresse ein.');
              await supabase.auth.signOut();
              navigate('/login');
              return;
            }
            const newEmail = refreshData.session?.user?.email || session.user.email || 'unknown';
            navigate(`/auth/email-change-confirmed?new_email=${encodeURIComponent(newEmail)}`);
            return;
          }
          const { error } = await supabase.auth.verifyOtp({
            token_hash: emailToken,
            type: emailType as 'signup' | 'recovery' | 'invite' | 'magiclink'
          });
          if (error) {
            const errorMsg = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : '';
            if (errorMsg.includes('429') || errorMsg.includes('rate')) {
              console.warn('Rate Limit erreicht. Bitte warten Sie einige Minuten.');
              navigate('/login');
              return;
            }
            if (errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('Email link is invalid')) {
              if (emailType === 'recovery') {
                navigate('/auth/forgot-password');
              } else {
                navigate('/auth/resend-confirmation');
              }
              return;
            }
            if (emailType === 'recovery') {
              navigate('/auth/forgot-password');
            } else {
              navigate('/auth/resend-confirmation');
            }
            return;
          }
          navigate('/auth/email-confirmed');
        }
        else {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            navigate('/login');
          } else if (session?.user) {
            const hasUsername = !!session.user.user_metadata?.username;
            const needsOnboarding = session.user.user_metadata?.needs_username_onboarding;
            const isNewUser = !hasUsername || needsOnboarding;
            if (isNewUser) {
              navigate('/onboarding/username');
            } else {
              navigate('/dashboard');
            }
          } else {
            navigate('/login');
          }
        }
      } catch {
        console.error('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
        navigate('/login');
      }
    };
    handleAuthCallback();
  }, [navigate]);
}
