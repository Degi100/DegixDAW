// ============================================
// RECOVERY USERNAME STEP
// Search for account by username
// ============================================

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { RecoveryUsernameStepProps } from '../types/recovery.types';

export default function RecoveryUsernameStep({
  username,
  onUsernameChange,
  onSubmit,
  onBack
}: RecoveryUsernameStepProps) {
  return (
    <div className="card card-large">
      <div className="card-header">
        <h1>👤 Account per Benutzername finden</h1>
        <p>Geben Sie Ihren Benutzernamen ein. Wir leiten Sie dann zur Support-Kontaktierung weiter:</p>
      </div>
      
      <form onSubmit={onSubmit} className="form">
        <div className="form-group">
          <Input
            label="Benutzername"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="z.B. max_mustermann oder john123"
            required
          />
        </div>

        <div className="info-box">
          <p><strong>💡 Username-Tipps:</strong></p>
          <ul>
            <li>Benutzernamen sind 3-20 Zeichen lang</li>
            <li>Enthalten nur Buchstaben, Zahlen und Unterstriche</li>
            <li>Wurden bei der Registrierung oder beim ersten OAuth-Login erstellt</li>
            <li>Oft basierend auf Ihrem Namen oder E-Mail-Adresse generiert</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <Button type="submit">
            Username prüfen
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
          >
            ← Zurück
          </Button>
        </div>
      </form>
    </div>
  );
}
