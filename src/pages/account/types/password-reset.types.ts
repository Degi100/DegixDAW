// ============================================
// PASSWORD RESET TYPES
// Shared TypeScript Interfaces for RecoverAccount
// ============================================

// Password reset step states
export type PasswordResetStep = 'verify' | 'reset' | 'success';

// Password reset form data
export interface PasswordResetData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// Component Props
// ============================================

// PasswordResetVerifyStep Component Props
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PasswordResetVerifyStepProps {
  // No props needed - just displays loading state
}

// PasswordResetFormStep Component Props
export interface PasswordResetFormStepProps {
  email: string;
  newPassword: string;
  confirmPassword: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onPasswordChange: (field: 'newPassword' | 'confirmPassword', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

// PasswordResetSuccessStep Component Props
export interface PasswordResetSuccessStepProps {
  onGoToLogin: () => void;
}
