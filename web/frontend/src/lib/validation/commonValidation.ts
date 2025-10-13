// src/lib/validation/commonValidation.ts
import { z } from 'zod';

// Generic validation result types
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
}

export interface AsyncValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
}

// Generic form validation utility
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
};

// Common field validation utilities
export const commonFields = {
  // Email validation
  email: z
    .string()
    .min(1, 'Email ist erforderlich')
    .email('Ungültige Email-Adresse'),
    
  // Password validation (basic)
  passwordBasic: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
    
  // Password validation (strong)
  passwordStrong: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'),
    
  // Full name validation
  fullName: z
    .string()
    .min(1, 'Vollständiger Name ist erforderlich')
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(50, 'Name darf maximal 50 Zeichen lang sein'),
    
  // Username validation
  username: z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(20, 'Benutzername darf maximal 20 Zeichen lang sein')
    .regex(/^[a-z0-9-_]+$/, 'Benutzername darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten'),
    
  // Optional username (can be empty)
  usernameOptional: z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(20, 'Benutzername darf maximal 20 Zeichen lang sein')
    .regex(/^[a-z0-9-_]+$/, 'Benutzername darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten')
    .optional()
    .or(z.literal('')),
};

// Common validation patterns
export const validationPatterns = {
  // Password strength regex
  passwordStrength: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  
  // Username format regex
  usernameFormat: /^[a-z0-9-_]+$/,
  
  // Email format (basic - let zod handle the detailed validation)
  emailBasic: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// Common validation messages
export const validationMessages = {
  required: (field: string) => `${field} ist erforderlich`,
  minLength: (field: string, min: number) => `${field} muss mindestens ${min} Zeichen lang sein`,
  maxLength: (field: string, max: number) => `${field} darf maximal ${max} Zeichen lang sein`,
  email: 'Ungültige Email-Adresse',
  passwordStrength: 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten',
  passwordMismatch: 'Passwörter stimmen nicht überein',
  usernameFormat: 'Benutzername darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten',
  usernameTaken: 'Dieser Benutzername ist bereits vergeben',
  nameTaken: 'Dieser Name ist bereits vergeben',
  currentPasswordIncorrect: 'Das aktuelle Passwort ist nicht korrekt',
  validationError: 'Fehler bei der Validierung',
};

// Helper function to create password confirmation validation
export const createPasswordConfirmation = (
  passwordField: string = 'password',
  confirmField: string = 'confirmPassword'
) => {
  return (data: Record<string, string>) => {
    return data[passwordField] === data[confirmField];
  };
};

// Helper function to format validation errors for UI
export const formatValidationErrors = (errors: Record<string, string>) => {
  return Object.entries(errors).map(([field, message]) => ({
    field,
    message,
  }));
};

// Helper function to check if form has validation errors
export const hasValidationErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

// Helper function to get first validation error
export const getFirstValidationError = (errors: Record<string, string>): string | null => {
  const errorKeys = Object.keys(errors);
  return errorKeys.length > 0 ? errors[errorKeys[0]] : null;
};

// Async validation helper types
export type AsyncValidator<T> = (data: T) => Promise<AsyncValidationResult<T>>;

// Helper to combine multiple async validators
export const combineAsyncValidators = <T>(
  validators: AsyncValidator<T>[]
) => {
  return async (data: T): Promise<AsyncValidationResult<T>> => {
    const allErrors: Record<string, string> = {};
    let lastValidData: T | undefined;

    for (const validator of validators) {
      const result = await validator(data);
      
      if (!result.success) {
        Object.assign(allErrors, result.errors);
      } else if (result.data) {
        lastValidData = result.data;
      }
    }

    if (Object.keys(allErrors).length > 0) {
      return { success: false, errors: allErrors };
    }

    return { success: true, data: lastValidData || data, errors: {} };
  };
};

// Debounced validation helper (for real-time validation)
export const createDebouncedValidator = <T>(
  validator: (data: T) => ValidationResult<T> | Promise<ValidationResult<T>>,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (data: T): Promise<ValidationResult<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        const result = await validator(data);
        resolve(result);
      }, delay);
    });
  };
};