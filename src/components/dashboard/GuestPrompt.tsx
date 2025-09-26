// src/components/ui/GuestPrompt.tsx
import Button from '../ui/Button';
import { BENEFITS, EMOJIS, APP_CONFIG } from '../../lib/constants';

interface GuestPromptProps {
  onNavigateToLogin: () => void;
}

export default function GuestPrompt({ onNavigateToLogin }: GuestPromptProps) {
  return (
    <>
      <section className="guest-section">
        <div className="card card-large center">
          <h2 className="guest-title">Entdecken Sie {APP_CONFIG.name}</h2>
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
          <h3 className="guest-title">{EMOJIS.lock} Erweiterte Features freischalten</h3>
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