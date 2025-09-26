// src/lib/validation/index.ts
// Barrel export file for validation modules

// Re-export auth validation
export {
  signInSchema,
  signUpSchema,
  validateSignUpAsync,
  validateEmailFormat,
  validatePasswordStrength,
  validateUsernameFormat,
  type SignInFormData,
  type SignUpFormData,
} from './authValidation';

// Re-export profile validation
export {
  userSettingsSchema,
  userSettingsWithPasswordSchema,
  passwordChangeSchema,
  validateUserSettingsAsync,
  validatePasswordChangeAsync,
  validateProfileAsync,
  validateFullName,
  type UserSettingsFormData,
  type UserSettingsWithPasswordFormData,
  type PasswordChangeFormData,
} from './profileValidation';

// Re-export common validation utilities
export {
  validateForm,
  commonFields,
  validationPatterns,
  validationMessages,
  createPasswordConfirmation,
  formatValidationErrors,
  hasValidationErrors,
  getFirstValidationError,
  combineAsyncValidators,
  createDebouncedValidator,
  type ValidationResult,
  type AsyncValidationResult,
  type AsyncValidator,
} from './commonValidation';

// Legacy exports for backward compatibility (deprecated - use specific imports)
/** @deprecated Use specific validation functions from authValidation or profileValidation modules */
export { validateSignUpAsync as validateSignUp } from './authValidation';

/** @deprecated Use validateForm from commonValidation module */
export { validateForm as validateFormGeneric } from './commonValidation';