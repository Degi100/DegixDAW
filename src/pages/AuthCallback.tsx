// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Processing URL:', window.location.href);
        console.log('AuthCallback: URL params:', window.location.search);
        console.log('AuthCallback: Hash params:', window.location.hash);
        
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
          console.log('Email link expired, redirecting to resend page');
          navigate('/auth/resend-confirmation');
          return;
        }
        
        // Handle OAuth callback (Google, Discord, etc.)
        if (accessToken && refreshToken) {
          console.log('OAuth callback detected, processing session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('OAuth Auth-Fehler:', error);
            alert('OAuth-Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
            navigate('/login');
          } else if (session?.user) {
            // Check if user needs username onboarding
            const user = session.user;
            const hasUsername = !!user.user_metadata?.username;
            const isOAuthUser = !!user.app_metadata?.provider && user.app_metadata.provider !== 'email';
            
            if (isOAuthUser && !hasUsername) {
              // New OAuth user without username → onboarding
              console.log('OAuth user needs username onboarding');
              navigate('/onboarding/username');
            } else {
              // Existing user or email user → dashboard
              console.log('OAuth user authenticated, redirecting to dashboard');
              navigate('/dashboard');
            }
          } else {
            console.log('No OAuth session found, redirecting to login');
            navigate('/login');
          }
        }
        // Handle email verification callback
        else if (emailToken && emailType) {
          console.log(`${emailType} callback detected`);
          
          // Handle password recovery differently
          if (emailType === 'recovery') {
            console.log('Password recovery callback detected');
            // For password recovery, just redirect to reset password page with token
            navigate(`/auth/recover?token=${emailToken}&email=${urlParams.get('email') || ''}`);
            return;
          }
          
          // Handle other email verification types (signup, invite, magiclink)
          const { error } = await supabase.auth.verifyOtp({
            token_hash: emailToken,
            type: emailType as 'signup' | 'recovery' | 'invite' | 'magiclink'
          });
          
          if (error) {
            console.error('Email-Bestätigung fehlgeschlagen:', error);
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
                console.log('Recovery link expired, redirecting to forgot password');
                navigate('/auth/forgot-password');
              } else {
                // For other types, redirect to resend confirmation
                console.log('Email link expired, redirecting to resend page');
                navigate('/auth/resend-confirmation');
              }
              return;
            }
            
            // Fallback for any other email verification errors
            console.log('Other email verification error, redirecting appropriately');
            if (emailType === 'recovery') {
              navigate('/auth/forgot-password');
            } else {
              navigate('/auth/resend-confirmation');
            }
            return;
          }
          
          // Email successfully confirmed! Show confirmation page
          console.log('Email successfully confirmed, showing confirmation page');
          navigate('/auth/email-confirmed');
        }
        // No clear callback type detected
        else {
          console.log('No clear callback detected, checking session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
            navigate('/login');
          } else if (session?.user) {
            console.log('Valid session found, redirecting to dashboard');
            navigate('/dashboard');
          } else {
            console.log('No session found, redirecting to login');
            navigate('/login');
          }
        }
      } catch (err) {
        console.error('Callback-Fehler:', err);
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