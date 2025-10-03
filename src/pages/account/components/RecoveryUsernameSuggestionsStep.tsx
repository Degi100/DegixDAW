// ============================================
// RECOVERY USERNAME SUGGESTIONS STEP
// Display username variations
// ============================================

import Button from '../../../components/ui/Button';
import type { RecoveryUsernameSuggestionsStepProps } from '../types/recovery.types';

export default function RecoveryUsernameSuggestionsStep({
  searchedUsername,
  suggestions,
  onSelectUsername,
  onContactSupport,
  onNewSearch
}: RecoveryUsernameSuggestionsStepProps) {
  return (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔍 Username-Vorschläge</h1>
        <p>Basierend auf "{searchedUsername}" haben wir folgende Variationen gefunden:</p>
      </div>
      
      <div className="card-content">
        <div className="username-suggestions">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="username-suggestion">
              <span className="username-text">{suggestion}</span>
              <Button
                onClick={() => onSelectUsername(suggestion)}
                variant="outline"
                size="small"
              >
                Das ist mein Username
              </Button>
            </div>
          ))}
        </div>

        <div className="info-box">
          <p><strong>💡 Nicht dabei?</strong></p>
          <p>Wenn keiner dieser Vorschläge Ihr Username ist, können Sie:</p>
          <ul>
            <li>Einen anderen Suchbegriff versuchen</li>
            <li>Direkt den Support kontaktieren</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <Button
            onClick={onContactSupport}
            variant="primary"
          >
            Support kontaktieren
          </Button>
          <Button
            onClick={onNewSearch}
            variant="outline"
          >
            ← Neue Suche
          </Button>
        </div>
      </div>
    </div>
  );
}
