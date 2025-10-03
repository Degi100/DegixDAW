// ============================================
// USERNAME ONBOARDING PAGE
// Set username during OAuth onboarding
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { updateProfile } from '../../lib/profile/profileActions';
import Container from '../../components/layout/Container';
import UsernameSuggestions from '../../components/ui/UsernameSuggestions';
import { APP_FULL_NAME, EMOJIS } from '../../lib/constants';
import { validateUsernameFormat } from '../../lib/validation/authValidation';
import { checkUsernameExists, supabase } from '../../lib/supabase';

// Import modular components
import UsernameInputSection from './components/UsernameInputSection';
import UsernameActionButtons from './components/UsernameActionButtons';

export default function UsernameOnboarding() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Generate fantasy username if none exists
  function generateFantasyUsername() {
    const base = 'user';
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${base}${random}`;
  }

  const initialUsername = user?.user_metadata?.username || generateFantasyUsername();
  const [username, setUsername] = useState(initialUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationError, setValidationError] = useState('');

  // User display information
  const userDisplayName = user?.user_metadata?.display_name || 
                          user?.user_metadata?.full_name || 
                          user?.email || 'Benutzer';
  
  const hasExistingUsername = !!user?.user_metadata?.username;

  // ============================================
  // EVENT HANDLERS
  // ============================================

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

  // Set username (fixed, no later changes)
  const handleSetUsername = async () => {
    if (!username.trim()) {
      setValidationError('Benutzername ist erforderlich');
      return;
    }
    
    const validation = validateUsernameFormat(username);
    if (!validation.valid && validation.error) {
      setValidationError(validation.error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const usernameTaken = await checkUsernameExists(username.trim());
      if (usernameTaken) {
        setValidationError('Dieser Benutzername ist bereits vergeben');
        setIsSubmitting(false);
        return;
      }

      // Update profile first
      const profileResult = await updateProfile(user?.id || '', {
        full_name: user?.user_metadata?.full_name || '',
        username: username.trim()
      });

      if (!profileResult.success) {
        error(`Fehler beim Erstellen des Profils: ${profileResult.error?.message}`);
        setIsSubmitting(false);
        return;
      }

      // Only update auth metadata if profile creation was successful
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          username_can_change: false,
          needs_username_onboarding: false,
          username: username.trim()
        }
      });

      if (metaError) {
        error(`Fehler beim Aktualisieren der Benutzerdaten: ${metaError.message}`);
        setIsSubmitting(false);
        return;
      }

      success(`${EMOJIS.success} Willkommen bei ${APP_FULL_NAME}! Ihr Benutzername wurde erfolgreich festgelegt.`);
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

  // Proceed with suggestion (username can be changed once later)
  const handleProceedWithSuggestion = async () => {
    if (!username.trim()) {
      setValidationError('Benutzername ist erforderlich');
      return;
    }
    
    const validation = validateUsernameFormat(username);
    if (!validation.valid && validation.error) {
      setValidationError(validation.error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const usernameTaken = await checkUsernameExists(username.trim());
      if (usernameTaken) {
        setValidationError('Dieser Benutzername ist bereits vergeben');
        setIsSubmitting(false);
        return;
      }
      
      await updateProfile(user?.id || '', {
        full_name: user?.user_metadata?.full_name || '',
        username: username.trim()
      });
      
      // Username can be changed once later
      await supabase.auth.updateUser({ 
        data: { 
          username_can_change: true, 
          needs_username_onboarding: false 
        } 
      });
      
      success(`${EMOJIS.success} Willkommen bei ${APP_FULL_NAME}! Sie können Ihren Benutzernamen später einmalig ändern.`);
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

  // ============================================
  // RENDER
  // ============================================

  // Redirect if user already has username
  if (hasExistingUsername) {
    navigate('/dashboard');
    return null;
  }

  return (
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

            <form className="form">
              <UsernameInputSection
                username={username}
                validationError={validationError}
                isSubmitting={isSubmitting}
                onUsernameChange={handleUsernameChange}
                onShowSuggestions={handleShowSuggestions}
              />

              {showSuggestions && (
                <UsernameSuggestions
                  fullName={userDisplayName}
                  currentUsername={username}
                  onSelectUsername={handleUsernameSelect}
                  show={showSuggestions}
                />
              )}

              <UsernameActionButtons
                username={username}
                validationError={validationError}
                isSubmitting={isSubmitting}
                onSetUsername={handleSetUsername}
                onProceedWithSuggestion={handleProceedWithSuggestion}
                onSkip={handleSkip}
              />
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
