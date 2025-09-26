// src/components/ui/AccountActions.tsx
import Button from '../ui/Button';

interface AccountActionsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function AccountActions({ onLogout, onDeleteAccount }: AccountActionsProps) {
  return (
    <section className="card card-large">
      <h2 className="section-title">⚠️ Konto-Aktionen</h2>
      
      <div className="danger-zone">
        <p className="danger-description">
          Vorsichtsmaßnahmen für Ihr Konto
        </p>
        
        <div className="button-group">
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