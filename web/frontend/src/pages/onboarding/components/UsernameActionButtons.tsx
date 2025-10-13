// ============================================
// USERNAME ACTION BUTTONS
// Action buttons for username onboarding
// ============================================

import Button from '../../../components/ui/Button';
import { EMOJIS, UI_TEXT } from '../../../lib/constants';
import type { UsernameActionButtonsProps } from '../types/username-onboarding.types';

export default function UsernameActionButtons({
  username,
  validationError,
  isSubmitting,
  onSetUsername,
  onProceedWithSuggestion,
  onSkip
}: UsernameActionButtonsProps) {
  return (
    <>
      <div className="form-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Button
          type="button"
          variant="primary"
          size="large"
          disabled={!username.trim() || !!validationError || isSubmitting}
          fullWidth
          onClick={onSetUsername}
        >
          {isSubmitting ? `${UI_TEXT.saving}` : `${EMOJIS.success} Benutzername festlegen (fix)}`}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="large"
          disabled={!username.trim() || !!validationError || isSubmitting}
          fullWidth
          onClick={onProceedWithSuggestion}
        >
          Mit Username-Vorschlag fortfahren (später einmalig änderbar)
        </Button>
      </div>

      <div className="form-footer">
        <button
          type="button"
          onClick={onSkip}
          className="link-button text-secondary"
          disabled={isSubmitting}
        >
          Später festlegen (Weiter zum Dashboard)
        </button>
      </div>
    </>
  );
}
