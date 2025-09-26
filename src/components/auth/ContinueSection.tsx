// src/components/ui/ContinueSection.tsx
import Button from '../ui/Button';
import styles from './ContinueSection.module.css';

interface ContinueSectionProps {
  onContinue: () => void;
}

export default function ContinueSection({ onContinue }: ContinueSectionProps) {
  return (
    <div className={styles.continueSection}>
      <p className={styles.continueText}>
        Oder erkunden Sie die App ohne Anmeldung:
      </p>
      <Button 
        onClick={onContinue}
        variant="outline"
      >
        Weiter ohne Login
      </Button>
    </div>
  );
}