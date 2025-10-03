// ============================================
// RECOVERY TYPES - Shared TypeScript Interfaces
// ============================================

// Recovery step states
export type RecoveryStep = 'options' | 'username' | 'username-suggestions' | 'contact' | 'success';

// Contact form data
export interface ContactDetails {
  name: string;
  description: string;
  alternateEmail: string;
}

// ============================================
// Component Props
// ============================================

// RecoveryOptionsStep Component Props
export interface RecoveryOptionsStepProps {
  onSelectUsername: () => void;
  onSelectContact: () => void;
  onBackToLogin: () => void;
}

// RecoveryUsernameStep Component Props
export interface RecoveryUsernameStepProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

// RecoveryUsernameSuggestionsStep Component Props
export interface RecoveryUsernameSuggestionsStepProps {
  searchedUsername: string;
  suggestions: string[];
  onSelectUsername: (username: string) => void;
  onContactSupport: () => void;
  onNewSearch: () => void;
}

// RecoveryContactStep Component Props
export interface RecoveryContactStepProps {
  contactDetails: ContactDetails;
  onContactChange: (field: keyof ContactDetails, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

// RecoverySuccessStep Component Props
export interface RecoverySuccessStepProps {
  onGoToLogin: () => void;
  onGoToHome: () => void;
}
