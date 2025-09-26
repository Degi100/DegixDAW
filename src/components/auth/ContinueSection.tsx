// src/components/ui/ContinueSection.tsx
import Button from '../ui/Button';

interface ContinueSectionProps {
  onContinue: () => void;
}

export default function ContinueSection({ onContinue }: ContinueSectionProps) {
  return (
    <div className="card card-medium center">
      <p className="text-secondary">
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