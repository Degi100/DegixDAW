// src/pages/Login.advanced.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { useToast } from '../hooks/useToast';
import { signInSchema, signUpSchema, validateSignUpAsync } from '../lib/validation';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import UsernameSuggestions from '../components/ui/UsernameSuggestions';
import { ToastContainer } from '../components/ui/Toast';
import { Spinner } from '../components/ui/Loading';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();
  const { success, error: showError } = useToast();

  // Login Form
  const loginForm = useForm({
    schema: signInSchema,
    initialValues: { email: '', password: '' },
    onSubmit: async (data) => {
      const result = await signInWithEmail(data.email, data.password);
      
      if (result.success) {
        success('Erfolgreich angemeldet!');
        navigate('/');
      } else {
        showError(result.error?.message || 'Anmeldung fehlgeschlagen');
      }
    }
  });

  // Signup Form
  const signupForm = useForm({
    schema: signUpSchema,
    initialValues: { 
      email: '', 
      password: '', 
      confirmPassword: '', 
      fullName: '', 
      username: '' 
    },
    onSubmit: async (data) => {
      // Erst async Validierung
      const validationResult = await validateSignUpAsync(data);
      
      if (!validationResult.success) {
        // Zeige Validierungsfehler über setErrors
        signupForm.setErrors(validationResult.errors);
        return;
      }
      
      const result = await signUpWithEmail({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        username: data.username
      });
      
      if (result.success) {
        success('Registrierung erfolgreich! Bitte überprüfen Sie Ihre Email.', {
          duration: 8000
        });
      } else {
        showError(result.error?.message || 'Registrierung fehlgeschlagen');
      }
    }
  });

  const currentForm = isLogin ? loginForm : signupForm;

  // Zeige Username-Suggestions wenn Name oder Username eingegeben wird
  useEffect(() => {
    if (!isLogin) {
      const hasFullName = signupForm.values.fullName && signupForm.values.fullName.trim().length >= 2;
      const hasUsername = signupForm.values.username && signupForm.values.username.trim().length >= 2;
      
      if (hasFullName || hasUsername) {
        setShowUsernameSuggestions(true);
      } else {
        setShowUsernameSuggestions(false);
      }
    } else {
      setShowUsernameSuggestions(false);
    }
  }, [isLogin, signupForm.values.fullName, signupForm.values.username]);



  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    const result = await signInWithOAuth(provider);
    
    if (!result.success) {
      showError(result.error?.message || `${provider} Login fehlgeschlagen`);
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
        
        {/* Email/Password Form */}
        <div className={styles.formSection}>
          <h3 className={styles.formTitle}>
            {isLogin ? 'Anmelden' : 'Registrieren'} mit Email
          </h3>
          
          <form onSubmit={currentForm.handleSubmit} className={styles.form}>
            {!isLogin && (
              <>
                <Input
                  {...signupForm.getFieldProps('fullName')}
                  type="text"
                  placeholder="Vollständiger Name"
                  required
                  showCheckmark
                />
                
                <Input
                  {...signupForm.getFieldProps('username')}
                  type="text"
                  placeholder="Benutzername"
                  helpText="Optional - wird automatisch generiert falls leer"
                  showCheckmark
                />
                
                <UsernameSuggestions
                  fullName={signupForm.values.fullName}
                  currentUsername={signupForm.values.username || ''}
                  onSelectUsername={(username) => signupForm.setValue('username', username)}
                  show={showUsernameSuggestions}
                />
              </>
            )}            <Input
              {...currentForm.getFieldProps('email')}
              type="email"
              placeholder="Email-Adresse"
              required
              showCheckmark
            />
            
            <Input
              {...currentForm.getFieldProps('password')}
              type="password"
              placeholder="Passwort"
              required
              showPasswordToggle
              showCheckmark
              helpText={!isLogin ? "Mindestens 6 Zeichen, mit Groß-/Kleinbuchstaben und Zahl" : undefined}
            />

            {!isLogin && (
              <Input
                {...signupForm.getFieldProps('confirmPassword')}
                type="password"
                placeholder="Passwort bestätigen"
                required
                showPasswordToggle
                showCheckmark
              />
            )}
            
            <Button
              type="submit"
              disabled={currentForm.isSubmitting}
              variant={isLogin ? "success" : "primary"}
              fullWidth
            >
              {currentForm.isSubmitting ? (
                <>
                  <Spinner size="small" />
                  Lädt...
                </>
              ) : (
                isLogin ? 'Anmelden' : 'Registrieren'
              )}
            </Button>
          </form>
          
          <div className={styles.toggleText}>
            {isLogin ? 'Noch kein Account?' : 'Bereits ein Account?'}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                // Reset forms when switching
                loginForm.reset();
                signupForm.reset();
              }}
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
              onClick={() => handleOAuthLogin('google')}
              variant="google"
            >
              Mit Google anmelden
            </Button>
            
            <Button 
              onClick={() => handleOAuthLogin('discord')}
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
      
      <ToastContainer toasts={useToast().toasts} onRemove={useToast().removeToast} />
    </>
  );
}