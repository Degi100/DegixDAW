// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        
        // Check URL hash and search params for auth data
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check if this is an OAuth callback (has access_token in hash)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        // Check if this is an email verification callback (has token and type in URL params)
        const emailToken = urlParams.get('token');
        const emailType = urlParams.get('type');
        
        const error_code = urlParams.get('error_code') || hashParams.get('error_code');
        const error_description = urlParams.get('error_description') || hashParams.get('error_description');
        
        // Check for errors first
        if (error_code === 'otp_expired' || error_description?.includes('expired')) {
          navigate('/auth/resend-confirmation');
          return;
        }
        
        // Handle OAuth callback (Google, Discord, etc.)
        if (accessToken && refreshToken) {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            alert('OAuth-Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
            navigate('/login');
          } else if (session?.user) {
            // STRICT: Check if user needs username onboarding
            const user = session.user;
            const hasUsername = !!user.user_metadata?.username;
            const needsOnboarding = user.user_metadata?.needs_username_onboarding;
            const isNewUser = !hasUsername || needsOnboarding;
            
            if (isNewUser) {
              // Any new user without username must go through onboarding
              navigate('/onboarding/username');
            } else {
              // Existing user with username → dashboard
              navigate('/dashboard');
            }
          } else {
            navigate('/login');
          }
        }
        // Handle email verification callback
        else if (emailToken && emailType) {
          
          // Handle password recovery differently
          if (emailType === 'recovery') {
            // For password recovery, just redirect to reset password page with token
            navigate(`/auth/recover?token=${emailToken}&email=${urlParams.get('email') || ''}`);
            return;
          }
          
          // Handle email change confirmation
          if (emailType === 'email_change') {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: emailToken,
              type: 'email_change'
            });
            
            if (error) {
              alert('❌ Email-Änderung fehlgeschlagen. Bitte versuchen Sie es erneut.');
              navigate('/settings');
              return;
            }
            
            
            // Check if we have a valid session with the new email
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
              // Email change successful but no session - user needs to re-login
              alert('✅ Email-Adresse erfolgreich geändert!\n\n' +
                    'Aus Sicherheitsgründen wurden Sie abgemeldet.\n' +
                    'Bitte melden Sie sich mit Ihrer neuen Email-Adresse an.');
              navigate('/login');
              return;
            }
            
            
            // Force a complete session refresh
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              // Fallback: logout and ask user to login with new email
              alert('✅ Email-Adresse geändert!\n\n' +
                    'Bitte loggen Sie sich mit Ihrer neuen Email-Adresse ein.');
              await supabase.auth.signOut();
              navigate('/login');
              return;
            }
            
            
            // Success - redirect to email change confirmation page
            const newEmail = refreshData.session?.user?.email || session.user.email || 'unknown';
            navigate(`/auth/email-change-confirmed?new_email=${encodeURIComponent(newEmail)}`);
            return;
          }
          
          // Handle other email verification types (signup, invite, magiclink)
          const { error } = await supabase.auth.verifyOtp({
            token_hash: emailToken,
            type: emailType as 'signup' | 'recovery' | 'invite' | 'magiclink'
          });
          
          if (error) {
            const errorMsg = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : '';
            
            // Check for specific error codes and messages
            if (errorMsg.includes('429') || errorMsg.includes('rate')) {
              alert('⏰ Rate Limit erreicht. Bitte warten Sie einige Minuten.');
              navigate('/login');
              return;
            } 
            
            if (errorMsg.includes('expired') || 
                errorMsg.includes('invalid') || 
                errorMsg.includes('Email link is invalid')) {
              // For recovery type, redirect to forgot password
              if (emailType === 'recovery') {
                navigate('/auth/forgot-password');
              } else {
                // For other types, redirect to resend confirmation
                navigate('/auth/resend-confirmation');
              }
              return;
            }
            
            // Fallback for any other email verification errors
            if (emailType === 'recovery') {
              navigate('/auth/forgot-password');
            } else {
              navigate('/auth/resend-confirmation');
            }
            return;
          }
          
          // Email successfully confirmed! Show confirmation page
          navigate('/auth/email-confirmed');
        }
        // No clear callback type detected
        else {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            navigate('/login');
          } else if (session?.user) {
            // Apply same strict onboarding check
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
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h2>Wird weitergeleitet... 🎶</h2>
      <p>Wenn es nicht funktioniert, kehre zur <a href="/login">Login-Seite</a> zurück.</p>
    </div>
  );
}