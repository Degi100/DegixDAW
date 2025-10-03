// ============================================
// RECOVER ACCOUNT PAGE
// Password reset via recovery link
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import Container from '../../components/layout/Container';
import { LoadingOverlay } from '../../components/ui/Loading';

// Import modular step components
import PasswordResetVerifyStep from './components/PasswordResetVerifyStep';
import PasswordResetFormStep from './components/PasswordResetFormStep';
import PasswordResetSuccessStep from './components/PasswordResetSuccessStep';

// Import types
import type { PasswordResetStep, PasswordResetData } from './types/password-reset.types';

export default function RecoverAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();
  
  // State management
  const [currentStep, setCurrentStep] = useState<PasswordResetStep>('verify');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryData, setRecoveryData] = useState<PasswordResetData>({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract recovery token and email from URL parameters
  const recoveryToken = searchParams.get('token');
  const recoveryEmail = searchParams.get('email');

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Check if we have a valid session (Supabase handles token verification automatically via URL)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.error('Session error:', sessionError);
          error('❌ Der Recovery-Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.');
          navigate('/auth/forgot-password');
          return;
        }
        
        // Session is valid, get user email
        const userEmail = session.user.email || recoveryEmail || '';
        setRecoveryData(prev => ({ ...prev, email: userEmail }));
        setCurrentStep('reset');
      } catch (err) {
        console.error('Token verification error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
        error(`❌ Token-Verifizierung fehlgeschlagen: ${errorMsg}. Bitte fordern Sie einen neuen Recovery-Link an.`);
        navigate('/auth/forgot-password');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [recoveryToken, recoveryEmail, error, navigate]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!recoveryData.newPassword) {
      newErrors.newPassword = 'Neues Passwort ist erforderlich';
    } else if (recoveryData.newPassword.length < 8) {
      newErrors.newPassword = 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    if (!recoveryData.confirmPassword) {
      newErrors.confirmPassword = 'Passwort-Bestätigung ist erforderlich';
    } else if (recoveryData.newPassword !== recoveryData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsSubmitting(true);
    try {
      // Use Supabase to update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: recoveryData.newPassword
      });
      
      if (updateError) {
        throw updateError;
      }

      // Sign out the user after password reset to avoid onboarding redirects
      await supabase.auth.signOut();
      
      success('🎉 Ihr Passwort wurde erfolgreich zurückgesetzt!');
      setCurrentStep('success');
    } catch (err) {
      console.error('Password reset error:', err);
      error('❌ Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    setRecoveryData(prev => ({ ...prev, [field]: value }));
  };

  // ============================================
  // STEP RENDERING
  // ============================================

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'verify':
        return <PasswordResetVerifyStep />;

      case 'reset':
        return (
          <PasswordResetFormStep
            email={recoveryData.email}
            newPassword={recoveryData.newPassword}
            confirmPassword={recoveryData.confirmPassword}
            errors={errors}
            isSubmitting={isSubmitting}
            onPasswordChange={handlePasswordChange}
            onSubmit={handlePasswordReset}
            onBackToLogin={() => navigate('/login')}
          />
        );

      case 'success':
        return (
          <PasswordResetSuccessStep
            onGoToLogin={() => navigate('/')}
          />
        );

      default:
        return <PasswordResetVerifyStep />;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <Container>
        <LoadingOverlay message="Lade Account Recovery..." />
      </Container>
    );
  }

  return (
    <Container>
      <div className="page">
        {renderCurrentStep()}
      </div>
    </Container>
  );
}
