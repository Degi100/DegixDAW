// ============================================
// USERNAME ONBOARDING TYPES
// Shared TypeScript Interfaces
// ============================================

// ============================================
// Component Props
// ============================================

// UsernameInputSection Component Props
export interface UsernameInputSectionProps {
  username: string;
  validationError: string;
  isSubmitting: boolean;
  onUsernameChange: (value: string) => void;
  onShowSuggestions: () => void;
}

// UsernameActionButtons Component Props
export interface UsernameActionButtonsProps {
  username: string;
  validationError: string;
  isSubmitting: boolean;
  onSetUsername: () => void;
  onProceedWithSuggestion: () => void;
  onSkip: () => void;
}
