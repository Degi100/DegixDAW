// src/components/ui/GuestPrompt.tsx
import Button from '../ui/Button';

interface GuestPromptProps {
  onNavigateToLogin: () => void;
}

const BENEFITS = [
  { icon: '💾', text: 'Eigene Audio- und MIDI-Aufnahmen speichern' },
  { icon: '🤝', text: 'Ideen mit anderen Musikern teilen' },
  { icon: '⭐', text: 'Favoriten markieren und organisieren' },
  { icon: '🎯', text: 'An Community-Projekten teilnehmen' },
  { icon: '☁️', text: 'Cloud-Synchronisation für alle Geräte' }
];

export default function GuestPrompt({ onNavigateToLogin }: GuestPromptProps) {
  return (
    <>
      <section className="guest-section">
        <div className="card card-large center">
          <h2 className="guest-title">Entdecken Sie DegixDAW</h2>
          <p className="guest-description">
            Sie nutzen die App ohne Anmeldung. Melden Sie sich an, um alle Features zu nutzen!
          </p>
          
          <div className="button-group">
            <Button 
              onClick={onNavigateToLogin}
              variant="primary"
              size="large"
            >
              🚀 Jetzt anmelden
            </Button>
          </div>
        </div>
      </section>

      <section className="guest-section">
        <div className="card card-large center">
          <h3 className="guest-title">🔓 Erweiterte Features freischalten</h3>
          <div className="benefits-list">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <span className="benefit-icon">{benefit.icon}</span>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={onNavigateToLogin}
            variant="success"
            size="large"
            fullWidth
          >
            🚀 Kostenloses Konto erstellen
          </Button>
        </div>
      </section>
    </>
  );
}