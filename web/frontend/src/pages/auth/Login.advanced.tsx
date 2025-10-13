// src/pages/Login.advanced.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import AuthForm from '../../components/auth/AuthForm';
import OAuthSection from '../../components/auth/OAuthSection';
import ContinueSection from '../../components/auth/ContinueSection';
import { APP_FULL_NAME } from '../../lib/constants';

export default function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        success('Erfolgreich angemeldet!');
        navigate('/');
      } else {
        const errorMessage = result.error?.message || 'Anmeldung fehlgeschlagen';
        
        // Check if it's an email confirmation issue
        if (result.error?.type === 'validation' && 
            (errorMessage.includes('abgelaufen') || errorMessage.includes('bestätigen'))) {
          // Redirect to resend confirmation page with email
          navigate(`/auth/resend-confirmation?email=${encodeURIComponent(email)}`);
          return;
        }
        
        showError(errorMessage);
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
        const errorMessage = result.error?.message || 'Registrierung fehlgeschlagen';
        
        // Special handling for duplicate email
        if (result.error?.type === 'validation' && 
            errorMessage.includes('bereits registriert')) {
          // Show error with suggestion to login instead
          showError(errorMessage);
          
          // Auto-switch to login tab after a moment
          setTimeout(() => {
            document.querySelector('[data-tab="login"]')?.scrollIntoView({ behavior: 'smooth' });
          }, 3000);
        } else {
          showError(errorMessage);
        }
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
      <div className="container-narrow page">
        <h1 className="page-title">{APP_FULL_NAME}</h1>
        <p className="page-subtitle">
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
    </>
  );
}