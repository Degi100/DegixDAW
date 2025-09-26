// src/pages/UsernameOnboarding.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import Container from '../components/layout/Container';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import UsernameSuggestions from '../components/ui/UsernameSuggestions';
import { ToastContainer } from '../components/ui/Toast';
import { APP_FULL_NAME, EMOJIS, UI_TEXT } from '../lib/constants';
import { validateUsernameFormat } from '../lib/validation/authValidation';

export default function UsernameOnboarding() {
  const { user } = useAuth();
  const { updateProfile } = useProfile(user);
  const { success, error, toasts, removeToast } = useToast();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Redirect if user already has username or is not OAuth user
  const userDisplayName = user?.user_metadata?.display_name || 
                          user?.user_metadata?.full_name || 
                          user?.email || 'Benutzer';
  
  const hasExistingUsername = !!user?.user_metadata?.username;
  
  // Validate username format on input
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setValidationError('');
    
    if (value.trim()) {
      const validation = validateUsernameFormat(value);
      if (!validation.valid && validation.error) {
        setValidationError(validation.error);
      }
    }
  };

  // Show username suggestions
  const handleShowSuggestions = () => {
    if (!username.trim()) {
      // Use display name as base for suggestions
      const baseName = user?.user_metadata?.full_name || 
                      user?.user_metadata?.display_name || 
                      user?.email?.split('@')[0] || '';
      setUsername(baseName);
    }
    setShowSuggestions(true);
  };

  // Handle username selection from suggestions
  const handleUsernameSelect = (selectedUsername: string) => {
    setUsername(selectedUsername);
    setShowSuggestions(false);
    setValidationError('');
  };

  // Submit username
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setValidationError('Benutzername ist erforderlich');
      return;
    }

    // Validate format
    const validation = validateUsernameFormat(username);
    if (!validation.valid && validation.error) {
      setValidationError(validation.error);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await updateProfile({
        full_name: user?.user_metadata?.full_name || '',
        username: username.trim()
      });
      
      success(`${EMOJIS.success} Willkommen bei ${APP_FULL_NAME}! Ihr Benutzername wurde erfolgreich festgelegt.`);
      
      // Redirect to dashboard after successful username setup
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      error(`Fehler beim Speichern des Benutzernamens: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip onboarding (emergency fallback)
  const handleSkip = () => {
    navigate('/dashboard');
  };

  // Redirect if user already has username
  if (hasExistingUsername) {
    navigate('/dashboard');
    return null;
  }

  return (
    <>
      <div className="page">
        <Container>
          <div className="page-header">
            <h1 className="page-title">{EMOJIS.logo} Willkommen bei {APP_FULL_NAME}</h1>
            <p className="page-description">
              Hallo {userDisplayName}! Wählen Sie einen Benutzernamen für Ihr Profil.
            </p>
          </div>

          <div className="content-center">
            <div className="card card-large">
              <div className="card-header">
                <h2 className="card-title">{EMOJIS.community} Benutzername wählen</h2>
                <p className="card-description">
                  Ihr Benutzername wird öffentlich sichtbar sein und kann später nicht mehr geändert werden.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="form">
                <div className="input-group">
                  <label htmlFor="username" className="input-label">
                    Benutzername *
                  </label>
                  <div className="input-wrapper">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="ihr-benutzername"
                      className={validationError ? 'input-error' : ''}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    {validationError && (
                      <div className="input-error-message">{validationError}</div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleShowSuggestions}
                    disabled={isSubmitting}
                    fullWidth
                  >
                    ✨ Vorschläge anzeigen
                  </Button>
                </div>

                {showSuggestions && (
                  <UsernameSuggestions
                    fullName={userDisplayName}
                    currentUsername={username}
                    onSelectUsername={handleUsernameSelect}
                    show={showSuggestions}
                  />
                )}

                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    disabled={!username.trim() || !!validationError || isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? `${UI_TEXT.saving}` : `${EMOJIS.success} Benutzername festlegen`}
                  </Button>
                </div>

                <div className="form-footer">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="link-button text-secondary"
                    disabled={isSubmitting}
                  >
                    Später festlegen (Weiter zum Dashboard)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </div>

      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast} 
      />
    </>
  );
}