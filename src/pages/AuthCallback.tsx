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
        
        // Get token from either source
        const token = urlParams.get('token') || hashParams.get('access_token');
        const type = urlParams.get('type') || 'signup';
        const error_code = urlParams.get('error_code') || hashParams.get('error_code');
        const error_description = urlParams.get('error_description') || hashParams.get('error_description');
        
        // Check for errors first
        if (error_code === 'otp_expired' || error_description?.includes('expired')) {
          console.log('Email link expired, redirecting to resend page');
          navigate('/auth/resend-confirmation');
          return;
        }
        
        if (token && type) {
          // Use the direct token verification method
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as 'signup' | 'recovery' | 'invite' | 'magiclink'
          });
          
          if (error) {
            console.error('Email-Bestätigung fehlgeschlagen:', error);
            const errorMsg = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : '';
            const errorCode = errorMsg;
            
            // Check for specific error codes and messages
            if (errorMsg.includes('429') || errorMsg.includes('rate')) {
              alert('⏰ Rate Limit erreicht. Bitte warten Sie einige Minuten.');
              navigate('/login');
              return;
            } 
            
            if (errorMsg.includes('expired') || 
                errorMsg.includes('invalid') || 
                errorCode.includes('otp_expired') ||
                errorMsg.includes('Email link is invalid')) {
              // Immediately redirect to resend confirmation page
              console.log('Email link expired, redirecting to resend page');
              navigate('/auth/resend-confirmation');
              return;
            }
            
            // Fallback for any other email verification errors
            console.log('Other email verification error, redirecting to resend page');
            navigate('/auth/resend-confirmation');
            return;
          }
          
          // Email successfully confirmed! Show confirmation page
          console.log('Email successfully confirmed, showing confirmation page');
          navigate('/auth/email-confirmed');
        } else {
          // Standard OAuth-Callback
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth-Fehler:', error);
            alert('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
            navigate('/login');
          } else if (session?.user) {
            // Check if user needs username onboarding
            const user = session.user;
            const hasUsername = !!user.user_metadata?.username;
            const isOAuthUser = !!user.app_metadata?.provider && user.app_metadata.provider !== 'email';
            
            if (isOAuthUser && !hasUsername) {
              // New OAuth user without username → onboarding
              navigate('/onboarding/username');
            } else {
              // Existing user or email user → dashboard
              navigate('/dashboard');
            }
          } else {
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