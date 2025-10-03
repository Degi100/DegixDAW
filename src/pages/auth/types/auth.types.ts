// ============================================
// AUTH TYPES - Shared TypeScript Interfaces
// ============================================

// Login form state
export interface LoginFormData {
  email: string;
  password: string;
}

// Register form state
export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// OAuth providers
export type OAuthProvider = 'google' | 'discord';

// ============================================
// Component Props
// ============================================

// AuthHeader Component Props
export interface AuthHeaderProps {
  onThemeToggle: () => void;
  isDark: boolean;
  appName: string;
  appSubtitle: string;
}

// AuthHero Component Props
export interface AuthHeroProps {
  title: string;
  subtitle: string;
}

// AuthLoginForm Component Props
export interface AuthLoginFormProps {
  loginData: LoginFormData;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: keyof LoginFormData, value: string) => void;
  onOAuthLogin: (provider: OAuthProvider) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

// AuthRegisterForm Component Props
export interface AuthRegisterFormProps {
  registerData: RegisterFormData;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: keyof RegisterFormData, value: string) => void;
  onSwitchToLogin: () => void;
}
