// ============================================
// USERNAME INPUT SECTION
// Username input field with validation
// ============================================

import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import type { UsernameInputSectionProps } from '../types/username-onboarding.types';

export default function UsernameInputSection({
  username,
  validationError,
  isSubmitting,
  onUsernameChange,
  onShowSuggestions
}: UsernameInputSectionProps) {
  return (
    <>
      <div className="input-group">
        <label htmlFor="username" className="input-label">
          Benutzername *
        </label>
        <div className="input-wrapper">
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="ihr-benutzername"
            className={validationError ? 'input-error' : ''}
            disabled={isSubmitting}
            autoFocus
          />
          {validationError && (
            <div className="input-error-message">{validationError}</div>
          )}
        </div>
      </div>

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onShowSuggestions}
          disabled={isSubmitting}
          fullWidth
        >
          ✨ Vorschläge anzeigen
        </Button>
      </div>
    </>
  );
}
