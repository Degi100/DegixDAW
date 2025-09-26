// src/components/ui/GuestPrompt.tsx
import Button from './Button';
import styles from './GuestPrompt.module.css';

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
      <section className={styles.guestSection}>
        <div className={styles.guestCard}>
          <h2 className={styles.guestTitle}>Entdecken Sie DegixDAW</h2>
          <p className={styles.guestDescription}>
            Sie nutzen die App ohne Anmeldung. Melden Sie sich an, um alle Features zu nutzen!
          </p>
          
          <div className={styles.actionButtons}>
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

      <section className={styles.guestPromptSection}>
        <div className={styles.guestPromptCard}>
          <h3 className={styles.guestPromptTitle}>🔓 Erweiterte Features freischalten</h3>
          <div className={styles.benefitsList}>
            {BENEFITS.map((benefit, index) => (
              <div key={index} className={styles.benefit}>
                <span className={styles.benefitIcon}>{benefit.icon}</span>
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