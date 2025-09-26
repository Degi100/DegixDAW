// src/lib/validation/profileValidation.ts
import { z } from 'zod';

// User Settings Schema (without password change)
export const userSettingsSchema = z.object({
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
});

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

// Password Change Only Schema
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z
    .string()
    .min(1, 'Neues Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'),
  confirmPassword: z
    .string()
    .min(1, 'Passwort bestätigen ist erforderlich'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Neue Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

// Type exports for profile schemas
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
export type UserSettingsWithPasswordFormData = z.infer<typeof userSettingsWithPasswordSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Async validation für UserSettings mit Passwort-Prüfung
export async function validateUserSettingsAsync(data: UserSettingsWithPasswordFormData) {
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
      const { verifyCurrentPassword } = await import('../supabase');
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

// Async validation für nur Passwort-Änderung
export async function validatePasswordChangeAsync(data: PasswordChangeFormData) {
  // Erst die standard Validierung
  const result = passwordChangeSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return { success: false, errors };
  }

  // Dann die async Prüfungen für aktuelles Passwort
  const asyncErrors: Record<string, string> = {};
  
  try {
    const { verifyCurrentPassword } = await import('../supabase');
    const isCurrentPasswordValid = await verifyCurrentPassword(data.currentPassword);
    if (!isCurrentPasswordValid) {
      asyncErrors.currentPassword = 'Das aktuelle Passwort ist nicht korrekt';
    }
  } catch (error) {
    console.error('Fehler bei der Passwort-Validierung:', error);
    asyncErrors.currentPassword = 'Fehler beim Prüfen des aktuellen Passworts';
  }
  
  if (Object.keys(asyncErrors).length > 0) {
    return { success: false, errors: asyncErrors };
  }
  
  return { success: true, data: result.data, errors: {} };
}

// Async validation für nur Profil-Änderungen (ohne Passwort)
export async function validateProfileAsync(data: UserSettingsFormData) {
  // Erst die standard Validierung
  const result = userSettingsSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return { success: false, errors };
  }

  // Dann die async Prüfungen für Benutzername/Name
  const asyncErrors: Record<string, string> = {};
  
  try {
    const { checkUsernameExists } = await import('../supabase');
    
    // Benutzername Prüfung (nur wenn angegeben und geändert)
    if (data.username && data.username.trim()) {
      const usernameExists = await checkUsernameExists(data.username);
      if (usernameExists) {
        asyncErrors.username = 'Dieser Benutzername ist bereits vergeben';
      }
    }
    
    // Vollständiger Name Prüfung (falls geändert)
    const nameExists = await checkUsernameExists(data.fullName);
    if (nameExists) {
      asyncErrors.fullName = 'Dieser Name ist bereits vergeben';
    }
  } catch (error) {
    console.error('Fehler bei der async Profil-Validierung:', error);
    // Bei Fehlern bei der Prüfung, lass die Änderung trotzdem zu
  }
  
  if (Object.keys(asyncErrors).length > 0) {
    return { success: false, errors: asyncErrors };
  }
  
  return { success: true, data: result.data, errors: {} };
}

// Profile validation utilities
export function validateFullName(fullName: string): { valid: boolean; error?: string } {
  const nameValidation = z
    .string()
    .min(1, 'Vollständiger Name ist erforderlich')
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(50, 'Name darf maximal 50 Zeichen lang sein')
    .safeParse(fullName);
    
  if (!nameValidation.success) {
    return { valid: false, error: nameValidation.error.issues[0].message };
  }
  
  return { valid: true };
}