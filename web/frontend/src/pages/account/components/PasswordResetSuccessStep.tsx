// ============================================
// PASSWORD RESET SUCCESS STEP
// Success confirmation
// ============================================

import Button from '../../../components/ui/Button';
import type { PasswordResetSuccessStepProps } from '../types/password-reset.types';

export default function PasswordResetSuccessStep({
  onGoToLogin
}: PasswordResetSuccessStepProps) {
  return (
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
            onClick={onGoToLogin}
            variant="primary"
          >
            Zur Anmeldung
          </Button>
        </div>
      </div>
    </div>
  );
}
