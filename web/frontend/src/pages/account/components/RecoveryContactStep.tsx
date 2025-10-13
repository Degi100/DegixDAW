// ============================================
// RECOVERY CONTACT STEP
// Contact support form
// ============================================

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { RecoveryContactStepProps } from '../types/recovery.types';

export default function RecoveryContactStep({
  contactDetails,
  onContactChange,
  onSubmit,
  onBack
}: RecoveryContactStepProps) {
  return (
    <div className="card card-large">
      <div className="card-header">
        <h1>📞 Support kontaktieren</h1>
        <p>Wir helfen Ihnen dabei, wieder Zugang zu Ihrem Account zu erhalten:</p>
      </div>
      
      <form onSubmit={onSubmit} className="form">
        <div className="form-group">
          <Input
            label="Vollständiger Name"
            type="text"
            value={contactDetails.name}
            onChange={(e) => onContactChange('name', e.target.value)}
            placeholder="Max Mustermann"
            required
          />
        </div>
        
        <div className="form-group">
          <Input
            label="Alternative E-Mail-Adresse (optional)"
            type="email"
            value={contactDetails.alternateEmail}
            onChange={(e) => onContactChange('alternateEmail', e.target.value)}
            placeholder="ihre.alternative@email.com"
          />
        </div>
        
        <div className="form-group">
          <label className="input-label">
            Beschreibung Ihres Problems *
          </label>
          <textarea
            className="textarea"
            value={contactDetails.description}
            onChange={(e) => onContactChange('description', e.target.value)}
            placeholder="Beschreiben Sie uns, was passiert ist und welche Informationen Sie noch über Ihren Account wissen..."
            rows={4}
            required
          />
        </div>
        
        <div className="info-box">
          <p><strong>ℹ️ Hilfreiche Informationen:</strong></p>
          <ul>
            <li>Ungefähres Registrierungsdatum</li>
            <li>Projekte oder Aktivitäten in Ihrem Account</li>
            <li>Verwendete OAuth-Provider (Google, Discord)</li>
            <li>Alle anderen Details, die zur Identifikation helfen könnten</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <Button type="submit">
            Anfrage senden
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
