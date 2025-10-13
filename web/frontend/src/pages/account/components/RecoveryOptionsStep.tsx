// ============================================
// RECOVERY OPTIONS STEP
// Initial step - choose recovery method
// ============================================

import Button from '../../../components/ui/Button';
import type { RecoveryOptionsStepProps } from '../types/recovery.types';

export default function RecoveryOptionsStep({
  onSelectUsername,
  onSelectContact,
  onBackToLogin
}: RecoveryOptionsStepProps) {
  return (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔐 Account-Wiederherstellung</h1>
        <p>Wählen Sie eine Wiederherstellungsmethode:</p>
      </div>
      
      <div className="card-content">
        <div className="recovery-options">
          <div className="recovery-option">
            <h3>📧 E-Mail vergessen</h3>
            <p>Sie können sich an Ihre E-Mail-Adresse nicht erinnern?</p>
            <Button
              onClick={onSelectUsername}
              variant="primary"
              fullWidth
            >
              Mit Benutzername suchen
            </Button>
          </div>
          
          <div className="recovery-option">
            <h3>🆘 Vollständiger Datenverlust</h3>
            <p>Sie haben sowohl E-Mail als auch Benutzername vergessen?</p>
            <Button
              onClick={onSelectContact}
              variant="outline"
              fullWidth
            >
              Support kontaktieren
            </Button>
          </div>
        </div>
        
        <div className="form-actions">
          <Button
            onClick={onBackToLogin}
            variant="outline"
          >
            ← Zurück zur Anmeldung
          </Button>
        </div>
      </div>
    </div>
  );
}
