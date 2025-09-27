// src/pages/RecoverAccount.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Container from '../components/layout/Container';
import { ToastContainer } from '../components/ui/Toast';
import { LoadingOverlay } from '../components/ui/Loading';

type RecoveryStep = 'verify' | 'reset' | 'success';

export default function RecoverAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Future: could use useAuth for actual password reset with token
  const { success, error, toasts, removeToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('verify');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryData, setRecoveryData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract recovery token and email from URL parameters
  const recoveryToken = searchParams.get('token');
  const recoveryEmail = searchParams.get('email');

  useEffect(() => {
    const verifyToken = async () => {
      if (!recoveryToken) {
        error('❌ Ungültiger Recovery-Link. Bitte überprüfen Sie den Link aus Ihrer E-Mail.');
        navigate('/auth/recovery');
        return;
      }

      try {
        // Verify the recovery token with Supabase
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: recoveryToken,
          type: 'recovery'
        });
        
        if (verifyError) {
          console.error('Token verification failed:', verifyError);
          if (verifyError.message.includes('expired')) {
            error('❌ Der Recovery-Link ist abgelaufen. Bitte fordern Sie einen neuen an.');
            navigate('/auth/forgot-password');
          } else {
            error('❌ Ungültiger Recovery-Link. Bitte überprüfen Sie den Link aus Ihrer E-Mail.');
            navigate('/auth/recovery');
          }
          return;
        }
        
        // Token is valid, get user email from session
        const userEmail = data.user?.email || recoveryEmail || '';
        setRecoveryData(prev => ({ ...prev, email: userEmail }));
        setCurrentStep('reset');
      } catch (err) {
        console.error('Token verification error:', err);
        error('❌ Token-Verifizierung fehlgeschlagen. Bitte versuchen Sie es mit einem neuen Recovery-Link.');
        navigate('/auth/recovery');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [recoveryToken, recoveryEmail, error, navigate]);

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
      
      success('🎉 Ihr Passwort wurde erfolgreich zurückgesetzt!');
      setCurrentStep('success');
    } catch (err) {
      console.error('Password reset error:', err);
      error('❌ Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVerifyStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔍 Recovery-Link wird verifiziert...</h1>
        <p>Bitte warten Sie, während wir Ihren Recovery-Link überprüfen.</p>
      </div>
      <LoadingOverlay message="Verifiziere Recovery-Token..." />
    </div>
  );

  const renderResetStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔐 Passwort zurücksetzen</h1>
        <p>Erstellen Sie ein neues Passwort für: <strong>{recoveryData.email}</strong></p>
      </div>
      
      <form onSubmit={handlePasswordReset} className="form">
        <div className="form-group">
          <Input
            label="E-Mail-Adresse"
            type="email"
            value={recoveryData.email}
            disabled
            readOnly
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Neues Passwort"
            type="password"
            value={recoveryData.newPassword}
            onChange={(e) => setRecoveryData(prev => ({ ...prev, newPassword: e.target.value }))}
            placeholder="Mindestens 8 Zeichen"
            error={errors.newPassword}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Neues Passwort bestätigen"
            type="password"
            value={recoveryData.confirmPassword}
            onChange={(e) => setRecoveryData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Passwort wiederholen"
            error={errors.confirmPassword}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="info-box">
          <p><strong>💡 Passwort-Tipps:</strong></p>
          <ul>
            <li>Mindestens 8 Zeichen lang</li>
            <li>Kombination aus Buchstaben, Zahlen und Sonderzeichen</li>
            <li>Vermeiden Sie einfache Wörter oder persönliche Daten</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <Button
            type="submit"
            disabled={isSubmitting || !recoveryData.newPassword || !recoveryData.confirmPassword}
          >
            {isSubmitting ? 'Passwort wird zurückgesetzt...' : 'Passwort zurücksetzen'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/login')}
            disabled={isSubmitting}
          >
            Zur Anmeldung
          </Button>
        </div>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="card card-large">
      <div className="card-header">
        <div className="success-icon">🎉</div>
        <h1>Passwort erfolgreich zurückgesetzt!</h1>
      </div>
      
      <div className="card-content">
        <div className="success-message">
          <p>Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
          
          <div className="info-box">
            <p><strong>📋 Nächste Schritte:</strong></p>
            <ul>
              <li>Melden Sie sich mit Ihrer E-Mail-Adresse und dem neuen Passwort an</li>
              <li>Überprüfen Sie Ihre Account-Einstellungen</li>
              <li>Erwägen Sie das Aktivieren der Zwei-Faktor-Authentifizierung</li>
            </ul>
          </div>
        </div>
        
        <div className="form-actions">
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
          >
            Jetzt anmelden
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'verify': return renderVerifyStep();
      case 'reset': return renderResetStep();
      case 'success': return renderSuccessStep();
      default: return renderVerifyStep();
    }
  };

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
      
      <ToastContainer 
        toasts={toasts}
        onRemove={removeToast}
      />
    </Container>
  );
}