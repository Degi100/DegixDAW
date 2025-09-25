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
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'),
  confirmPassword: z
    .string()
    .min(1, 'Passwort bestätigen ist erforderlich'),
  fullName: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(50, 'Name darf maximal 50 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
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

// User Settings Schema
export const userSettingsSchema = z.object({
  username: z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(20, 'Benutzername darf maximal 20 Zeichen lang sein')
    .regex(/^[a-z0-9-_]+$/, 'Benutzername darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten'),
  fullName: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(50, 'Name darf maximal 50 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
  displayName: z
    .string()
    .min(2, 'Anzeigename muss mindestens 2 Zeichen lang sein')
    .max(30, 'Anzeigename darf maximal 30 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
});

// Type exports
export type SignInData = z.infer<typeof signInSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type UserSettingsData = z.infer<typeof userSettingsSchema>;

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