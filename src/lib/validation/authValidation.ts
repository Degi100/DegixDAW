// src/lib/validation/authValidation.ts
import { z } from 'zod';

// Sign In Schema
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

// Sign Up Schema
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

// Type exports for auth schemas
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;

// Async validation function für Registrierung
export async function validateSignUpAsync(data: SignUpFormData) {
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
    const { checkUsernameExists } = await import('../supabase');
    
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

// Password validation utilities
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  const passwordValidation = z
    .string()
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten')
    .safeParse(password);
    
  if (!passwordValidation.success) {
    return { valid: false, error: passwordValidation.error.issues[0].message };
  }
  
  return { valid: true };
}

// Username validation utilities
export function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim() === '') {
    return { valid: true }; // Username is optional
  }

  // Usernamen, die 'admin' enthalten, sind verboten
  if (/admin/i.test(username)) {
    return { valid: false, error: "Benutzernamen dürfen 'admin' nicht enthalten." };
  }

  // Format-Prüfung (nur Kleinbuchstaben, Zahlen, Bindestriche, Unterstriche)
  const usernameValidation = z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(20, 'Benutzername darf maximal 20 Zeichen lang sein')
    .regex(/^[a-z0-9-_]+$/, 'Benutzername darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten')
    .safeParse(username);

  if (!usernameValidation.success) {
    return { valid: false, error: usernameValidation.error.issues[0].message };
  }

  return { valid: true };
}