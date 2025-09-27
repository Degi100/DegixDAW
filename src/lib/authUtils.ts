// src/lib/authUtils.ts
export interface AuthError {
  message: string;
  type: 'auth' | 'rate_limit' | 'validation' | 'network';
}

export interface AuthResult {
  success: boolean;
  error?: AuthError;
  message?: string;
}

export function handleAuthError(error: unknown): AuthError {
  console.error('Auth error:', error);

  // Handle Supabase auth errors
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    const message = error.message.toLowerCase();
    
    // Rate limiting
    if (message.includes('too many requests') || message.includes('rate limit')) {
      return {
        message: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
        type: 'rate_limit'
      };
    }
    
    // Invalid credentials
    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return {
        message: 'E-Mail oder Passwort ist falsch.',
        type: 'auth'
      };
    }
    
    // Email not confirmed
    if (message.includes('email not confirmed')) {
      return {
        message: 'Bitte bestätigen Sie Ihre E-Mail-Adresse.',
        type: 'validation'
      };
    }
    
    // OTP/Email link expired
    if (message.includes('otp_expired') || message.includes('email link is invalid') || message.includes('has expired')) {
      return {
        message: 'E-Mail-Bestätigungslink ist abgelaufen. Bitte registrieren Sie sich erneut.',
        type: 'validation'
      };
    }
    
    // User already registered
    if (message.includes('user already registered') || 
        message.includes('email already registered') ||
        message.includes('already been registered')) {
      return {
        message: 'Diese E-Mail-Adresse ist bereits registriert. Möchten Sie sich stattdessen anmelden?',
        type: 'validation'
      };
    }
    
    // Weak password
    if (message.includes('password is too weak') || message.includes('password should be at least')) {
      return {
        message: 'Das Passwort ist zu schwach. Es sollte mindestens 6 Zeichen lang sein.',
        type: 'validation'
      };
    }
    
    // Invalid email format
    if (message.includes('invalid email')) {
      return {
        message: 'Ungültiges E-Mail-Format.',
        type: 'validation'
      };
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return {
        message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
        type: 'network'
      };
    }
    
    // Return original message if no specific handling
    return {
      message: error.message as string,
      type: 'auth'
    };
  }
  
  // Fallback for unknown errors
  return {
    message: 'Ein unbekannter Fehler ist aufgetreten.',
    type: 'auth'
  };
}