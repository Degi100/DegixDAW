// ============================================
// RECOVERY SUCCESS STEP
// Success confirmation
// ============================================

import Button from '../../../components/ui/Button';
import type { RecoverySuccessStepProps } from '../types/recovery.types';

export default function RecoverySuccessStep({
  onGoToLogin,
  onGoToHome
}: RecoverySuccessStepProps) {
  return (
    <div className="card card-large">
      <div className="card-header">
        <div className="success-icon">✅</div>
        <h1>Anfrage erfolgreich gesendet!</h1>
      </div>
      
      <div className="card-content">
        <div className="success-message">
          <p>Vielen Dank für Ihre Anfrage. Unser Support-Team wird sich in Kürze bei Ihnen melden.</p>
          
          <div className="info-box">
            <p><strong>📋 Nächste Schritte:</strong></p>
            <ul>
              <li>Überprüfen Sie Ihr E-Mail-Postfach (auch Spam-Ordner)</li>
              <li>Antwortzeit: In der Regel 1-2 Werktage</li>
              <li>Halten Sie alle verfügbaren Account-Informationen bereit</li>
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
          <Button
            onClick={onGoToHome}
            variant="outline"
          >
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
}
