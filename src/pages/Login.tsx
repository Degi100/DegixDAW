// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Register
  const [loading, setLoading] = useState(false);

  const handleLogin = (provider: 'google' | 'discord') => async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error(`${provider} Login Fehler:`, error);
      alert(`Fehler beim ${provider}-Login`);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate('/');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Bitte Email und Passwort eingeben');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Anmelden
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        // Registrieren
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;
        alert('Registrierung erfolgreich! Bitte überprüfen Sie Ihre Email.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';
      
      if (errorMessage.includes('429') || errorMessage.includes('rate')) {
        alert('⏰ Zu viele Versuche. Bitte warten Sie einige Minuten und versuchen Sie es erneut.');
      } else if (errorMessage.includes('already registered')) {
        alert('📧 Diese Email ist bereits registriert. Versuchen Sie sich anzumelden.');
        setIsLogin(true);
      } else {
        alert(`Fehler: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: 'sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#4F46E5' }}>🎧 DegixDAW</h1>
      <p>
        <strong>D</strong>AW-integrated, <strong>E</strong>ffortless, <strong>G</strong>lobal, <strong>I</strong>nstant e<strong>X</strong>change
      </p>
      
      {/* Email/Passwort Login */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '2rem', 
        border: '1px solid #e5e5e5', 
        borderRadius: '8px',
        backgroundColor: '#fafafa' 
      }}>
        <h3 style={{ marginTop: 0, textAlign: 'center' }}>
          {isLogin ? 'Anmelden' : 'Registrieren'} mit Email
        </h3>
        
        <form onSubmit={handleEmailAuth} style={{ maxWidth: '300px', margin: '0 auto' }}>
          <input
            type="email"
            placeholder="Email-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              margin: '0.5rem 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            required
          />
          
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              margin: '0.5rem 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              margin: '0.5rem 0',
              backgroundColor: isLogin ? '#10B981' : '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Lädt...' : (isLogin ? 'Anmelden' : 'Registrieren')}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          {isLogin ? 'Noch kein Account?' : 'Bereits ein Account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#4F46E5',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {isLogin ? 'Hier registrieren' : 'Hier anmelden'}
          </button>
        </p>
      </div>

      {/* OAuth Login */}
      <div style={{ marginTop: '2rem' }}>
        <p style={{ textAlign: 'center', color: '#666', margin: '1rem 0' }}>
          Oder schnell anmelden mit:
        </p>
        
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={handleLogin('google')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              margin: '0.5rem', 
              backgroundColor: '#4285F4', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Mit Google anmelden
          </button>
          
          <button 
            onClick={handleLogin('discord')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              margin: '0.5rem', 
              backgroundColor: '#5865F2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Mit Discord anmelden
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e5e5' }}>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Oder erkunden Sie die App ohne Anmeldung:
        </p>
        <button 
          onClick={handleContinueWithoutLogin}
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: 'transparent', 
            color: '#4F46E5', 
            border: '2px solid #4F46E5', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Weiter ohne Login
        </button>
      </div>
    </div>
  );
}