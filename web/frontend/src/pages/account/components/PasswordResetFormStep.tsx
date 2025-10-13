// ============================================
// PASSWORD RESET FORM STEP
// New password form
// ============================================

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { PasswordResetFormStepProps } from '../types/password-reset.types';

export default function PasswordResetFormStep({
  email,
  newPassword,
  confirmPassword,
  errors,
  isSubmitting,
  onPasswordChange,
  onSubmit,
  onBackToLogin
}: PasswordResetFormStepProps) {
  return (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔐 Passwort zurücksetzen</h1>
        <p>Erstellen Sie ein neues Passwort für: <strong>{email}</strong></p>
      </div>
      
      <form onSubmit={onSubmit} className="form">
        <div className="form-group">
          <Input
            label="E-Mail-Adresse"
            type="email"
            value={email}
            disabled
            readOnly
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Neues Passwort"
            type="password"
            value={newPassword}
            onChange={(e) => onPasswordChange('newPassword', e.target.value)}
            placeholder="Mindestens 8 Zeichen"
            error={errors.newPassword}
            disabled={isSubmitting}
            required
            showPasswordToggle={true}
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Neues Passwort bestätigen"
            type="password"
            value={confirmPassword}
            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
            placeholder="Passwort wiederholen"
            error={errors.confirmPassword}
            disabled={isSubmitting}
            required
            showPasswordToggle={true}
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
            disabled={isSubmitting || !newPassword || !confirmPassword}
          >
            {isSubmitting ? 'Passwort wird zurückgesetzt...' : 'Passwort zurücksetzen'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBackToLogin}
            disabled={isSubmitting}
          >
            Zur Anmeldung
          </Button>
        </div>
      </form>
    </div>
  );
}
