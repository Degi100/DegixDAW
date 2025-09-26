// src/components/ui/AccountActions.tsx
import Button from '../ui/Button';
import styles from './AccountActions.module.css';

interface AccountActionsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function AccountActions({ onLogout, onDeleteAccount }: AccountActionsProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>⚠️ Konto-Aktionen</h2>
      
      <div className={styles.dangerZone}>
        <p className={styles.dangerDescription}>
          Vorsichtsmaßnahmen für Ihr Konto
        </p>
        
        <div className={styles.actionButtons}>
          <Button
            onClick={onLogout}
            variant="outline"
            fullWidth
          >
            👋 Von diesem Gerät abmelden
          </Button>
          
          <Button
            onClick={onDeleteAccount}
            variant="error"
            fullWidth
          >
            🗑️ Konto dauerhaft löschen
          </Button>
        </div>
      </div>
    </section>
  );
}