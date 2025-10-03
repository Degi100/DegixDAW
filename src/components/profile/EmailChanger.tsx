// src/components/profile/EmailChanger.tsx
import { useState, useEffect } from 'react';
import { useFormToggle } from '../../hooks/useFormToggle';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EmailChangerProps {
  currentEmail: string;
  onChangeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  isUpdating: boolean;
}

export default function EmailChanger({ currentEmail, onChangeEmail, isUpdating }: EmailChangerProps) {
  const { isFirstOption: isViewMode, toggle } = useFormToggle({ initialState: true });
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isViewMode) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        const input = document.querySelector('input[type="email"][placeholder="ihre.neue@email.com"]') as HTMLInputElement;
        input?.focus();
      }, 100);
    }
  }, [isViewMode]);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newEmail.trim()) {
      newErrors.newEmail = 'Neue E-Mail-Adresse ist erforderlich';
    } else if (!isValidEmail(newEmail)) {
      newErrors.newEmail = 'Ungültige E-Mail-Adresse';
    } else if (newEmail === currentEmail) {
      newErrors.newEmail = 'Die neue E-Mail-Adresse muss sich von der aktuellen unterscheiden';
    }
    
    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Aktuelles Passwort ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onChangeEmail(newEmail, currentPassword);
      // Reset form on success
      setNewEmail('');
      setCurrentPassword('');
      setErrors({});
      toggle(); // Close form
    } catch {
      // Error handling is done in parent component
    }
  };

  const handleCancel = () => {
    setNewEmail('');
    setCurrentPassword('');
    setErrors({});
    toggle();
  };

  if (isViewMode) {
    return (
      <div className="profile-section">
        <div className="profile-section-header">
          <h3>📧 E-Mail-Adresse</h3>
          <p className="profile-section-description">
            Aktuelle E-Mail: <strong>{currentEmail}</strong>
          </p>
        </div>
        <Button
          onClick={toggle}
          variant="outline"
          size="small"
          disabled={isUpdating}
        >
          E-Mail-Adresse ändern
        </Button>
      </div>
    );
  }

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h3>📧 E-Mail-Adresse ändern</h3>
        <p className="profile-section-description">
          Eine Bestätigungs-E-Mail wird an die neue Adresse gesendet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <Input
            label="Neue E-Mail-Adresse"
            type="email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setErrors(prev => ({ ...prev, newEmail: '' }));
            }}
            placeholder="ihre.neue@email.com"
            error={errors.newEmail}
            disabled={isUpdating}
            required
          />
        </div>

        <div className="form-group">
          <Input
            label="Aktuelles Passwort zur Bestätigung"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setErrors(prev => ({ ...prev, currentPassword: '' }));
            }}
            placeholder="Ihr aktuelles Passwort"
            error={errors.currentPassword}
            disabled={isUpdating}
            required
            showPasswordToggle={true}
          />
        </div>

        <div className="form-actions">
          <Button
            type="submit"
            disabled={isUpdating || !newEmail || !currentPassword}
          >
            {isUpdating ? 'Wird geändert...' : 'E-Mail-Adresse ändern'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Abbrechen
          </Button>
        </div>
      </form>

      <div className="info-box">
        <p><strong>ℹ️ Wichtiger Hinweis:</strong></p>
        <ul>
          <li>Sie erhalten eine Bestätigungs-E-Mail an die neue Adresse</li>
          <li>Ihre E-Mail-Adresse wird erst nach der Bestätigung geändert</li>
          <li>Bis zur Bestätigung können Sie sich weiterhin mit der alten E-Mail anmelden</li>
        </ul>
      </div>
    </div>
  );
}