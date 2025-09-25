// src/pages/Login.refactored.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const generateUsername = (fullName: string, email: string): string => {
    if (fullName.trim()) {
      return fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    const emailName = email.split('@')[0];
    return emailName.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const handleOAuthLogin = (provider: 'google' | 'discord') => async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'http://localhost:5173/auth/callback',
      },
    });
    if (error) {
      console.error(`${provider} Login Fehler:`, error);
      alert(`Fehler beim ${provider}-Login`);
    }
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const finalUsername = username.trim() || generateUsername(fullName, email);
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'http://localhost:5173/auth/callback',
            data: {
              username: finalUsername,
              full_name: fullName.trim() || null,
              display_name: fullName.trim() || finalUsername
            }
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

  const handleContinueWithoutLogin = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎧 DegixDAW</h1>
      <p className={styles.subtitle}>
        <strong>D</strong>AW-integrated, <strong>E</strong>ffortless, <strong>G</strong>lobal, <strong>I</strong>nstant e<strong>X</strong>change
      </p>
      
      {/* Email/Password Form */}
      <div className={styles.formSection}>
        <h3 className={styles.formTitle}>
          {isLogin ? 'Anmelden' : 'Registrieren'} mit Email
        </h3>
        
        <form onSubmit={handleEmailAuth} className={styles.form}>
          {!isLogin && (
            <>
              <Input
                type="text"
                placeholder="Vollständiger Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              
              <Input
                type="text"
                placeholder="Benutzername (optional - wird automatisch erstellt)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                helpText="Falls leer, wird automatisch aus Name oder Email generiert"
              />
            </>
          )}
          
          <Input
            type="email"
            placeholder="Email-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button
            type="submit"
            disabled={loading}
            variant={isLogin ? "success" : "primary"}
            fullWidth
          >
            {loading ? 'Lädt...' : (isLogin ? 'Anmelden' : 'Registrieren')}
          </Button>
        </form>
        
        <div className={styles.toggleText}>
          {isLogin ? 'Noch kein Account?' : 'Bereits ein Account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className={styles.toggleButton}
            type="button"
          >
            {isLogin ? 'Hier registrieren' : 'Hier anmelden'}
          </button>
        </div>
      </div>

      {/* OAuth Login */}
      <div className={styles.oauthSection}>
        <p className={styles.oauthTitle}>
          Oder schnell anmelden mit:
        </p>
        
        <div className={styles.buttonGroup}>
          <Button 
            onClick={handleOAuthLogin('google')}
            variant="google"
          >
            Mit Google anmelden
          </Button>
          
          <Button 
            onClick={handleOAuthLogin('discord')}
            variant="discord"
          >
            Mit Discord anmelden
          </Button>
        </div>
      </div>

      {/* Continue without login */}
      <div className={styles.continueSection}>
        <p className={styles.continueText}>
          Oder erkunden Sie die App ohne Anmeldung:
        </p>
        <Button 
          onClick={handleContinueWithoutLogin}
          variant="outline"
        >
          Weiter ohne Login
        </Button>
      </div>
    </div>
  );
}