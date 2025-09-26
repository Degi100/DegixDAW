// src/pages/Login.advanced.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import AuthForm from '../components/auth/AuthForm';
import OAuthSection from '../components/auth/OAuthSection';
import ContinueSection from '../components/auth/ContinueSection';
import { ToastContainer } from '../components/ui/Toast';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError, toasts, removeToast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        success('Erfolgreich angemeldet!');
        navigate('/');
      } else {
        showError(result.error?.message || 'Anmeldung fehlgeschlagen');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Anmeldung fehlgeschlagen: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }) => {
    setIsSubmitting(true);
    try {
      const result = await signUpWithEmail(data);
      
      if (result.success) {
        success('Registrierung erfolgreich! Bitte überprüfen Sie Ihre Email.', {
          duration: 8000
        });
      } else {
        showError(result.error?.message || 'Registrierung fehlgeschlagen');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Registrierung fehlgeschlagen: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    setIsSubmitting(true);
    try {
      const result = await signInWithOAuth(provider);
      
      if (!result.success) {
        showError(result.error?.message || `${provider} Login fehlgeschlagen`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`${provider} Login fehlgeschlagen: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate('/');
  };

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>🎧 DegixDAW</h1>
        <p className={styles.subtitle}>
          <strong>D</strong>AW-integrated, <strong>E</strong>ffortless, <strong>G</strong>lobal, <strong>I</strong>nstant e<strong>X</strong>change
        </p>
        
        <AuthForm 
          onLogin={handleLogin}
          onSignup={handleSignup}
          isSubmitting={isSubmitting}
        />
        
        <OAuthSection onOAuthLogin={handleOAuthLogin} />
        
        <ContinueSection onContinue={handleContinueWithoutLogin} />
      </div>
      
      <ToastContainer 
        toasts={toasts}
        onRemove={removeToast}
      />
    </>
  );
}