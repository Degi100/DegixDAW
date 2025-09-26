// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Überprüfe URL-Parameter für Email-Bestätigung
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        
        if (token && type) {
          // Email-Bestätigung verarbeiten
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as 'signup' | 'recovery' | 'invite' | 'magiclink'
          });
          
          if (error) {
            console.error('Email-Bestätigung fehlgeschlagen:', error);
            const errorMsg = error.message || '';
            
            if (errorMsg.includes('429') || errorMsg.includes('rate')) {
              alert('⏰ Rate Limit erreicht. Bitte warten Sie einige Minuten.');
            } else if (errorMsg.includes('expired')) {
              alert('📧 Email-Link ist abgelaufen. Bitte fordern Sie einen neuen an.');
            } else {
              alert('Email-Bestätigung fehlgeschlagen. Link ist möglicherweise abgelaufen.');
            }
            navigate('/login');
            return;
          }
          
          alert('Email erfolgreich bestätigt! Sie sind jetzt angemeldet.');
          navigate('/');
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