// src/lib/validation.ts
import { z } from 'zod';

// Auth Schemas
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email ist erforderlich')
    .email('Ungültige Email-Adresse'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email ist erforderlich')
    .email('Ungültige Email-Adresse'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'),
  confirmPassword: z
    .string()
    .min(1, 'Passwort bestätigen ist erforderlich'),
  fullName: z
    .string()
    .min(1, 'Vollständiger Name ist erforderlich')
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(50, 'Name darf maximal 50 Zeichen lang sein'),
  username: z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(20, 'Benutzername darf maximal 20 Zeichen lang sein')
    .regex(/^[a-z0-9-_]+$/, 'Benutzername darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

// Async validation function für Registrierung
export async function validateSignUpAsync(data: z.infer<typeof signUpSchema>) {
  // Erst die standard Validierung
  const result = signUpSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return { success: false, errors };
  }

  // Dann die async Prüfungen
  const asyncErrors: Record<string, string> = {};
  
  try {
    const { checkUsernameExists } = await import('./supabase');
    
    // Benutzername Prüfung (nur wenn angegeben)
    if (data.username && data.username.trim()) {
      const usernameExists = await checkUsernameExists(data.username);
      if (usernameExists) {
        asyncErrors.username = 'Dieser Benutzername ist bereits vergeben';
      }
    }
    
    // Vollständiger Name Prüfung
    const nameExists = await checkUsernameExists(data.fullName);
    if (nameExists) {
      asyncErrors.fullName = 'Dieser Name ist bereits vergeben';
    }
  } catch (error) {
    console.error('Fehler bei der async Validierung:', error);
    // Bei Fehlern bei der Prüfung, lass die Registrierung trotzdem zu
  }
  
  if (Object.keys(asyncErrors).length > 0) {
    return { success: false, errors: asyncErrors };
  }
  
  return { success: true, data: result.data, errors: {} };
}

// Email-Format-Validierung für Login (nur Format, keine Registrierungsprüfung)
export function validateEmailFormat(email: string): { valid: boolean; error?: string } {
  const emailValidation = z.string().email().safeParse(email);
  
  if (!emailValidation.success) {
    return { valid: false, error: 'Ungültige Email-Adresse' };
  }
  
  return { valid: true };
}

// User Settings with Password Change Schema
export const userSettingsWithPasswordSchema = z.object({
  fullName: z.string(),
  username: z.string(),
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
}).refine((data) => {
  // Only validate if password fields are filled
  if (data.newPassword || data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: 'Neue Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
}).refine((data) => {
  // Validate new password strength if provided
  if (data.newPassword) {
    return data.newPassword.length >= 6 && 
           /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.newPassword);
  }
  return true;
}, {
  message: 'Neues Passwort muss mindestens 6 Zeichen lang sein und einen Großbuchstaben, Kleinbuchstaben und eine Zahl enthalten',
  path: ['newPassword'],
});

// Async validation für UserSettings mit Passwort-Prüfung
export async function validateUserSettingsAsync(data: z.infer<typeof userSettingsWithPasswordSchema>) {
  // Erst die standard Validierung
  const result = userSettingsWithPasswordSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return { success: false, errors };
  }

  // Dann die async Prüfungen
  const asyncErrors: Record<string, string> = {};
  
  try {
    // Aktuelles Passwort prüfen (nur wenn angegeben)
    if (data.currentPassword && data.currentPassword.trim()) {
      const { verifyCurrentPassword } = await import('./supabase');
      const isCurrentPasswordValid = await verifyCurrentPassword(data.currentPassword);
      if (!isCurrentPasswordValid) {
        asyncErrors.currentPassword = 'Das aktuelle Passwort ist nicht korrekt';
      }
    }
  } catch (error) {
    console.error('Fehler bei der async Validierung:', error);
    // Bei Fehlern bei der Prüfung, zeige Fehler
    asyncErrors.currentPassword = 'Fehler beim Prüfen des aktuellen Passworts';
  }
  
  if (Object.keys(asyncErrors).length > 0) {
    return { success: false, errors: asyncErrors };
  }
  
  return { success: true, data: result.data, errors: {} };
}

// Type exports



// Validation utilities
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, data: null, errors };
};