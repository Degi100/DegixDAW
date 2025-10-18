// src/lib/urlUtils.ts

/**
 * Get the base URL for redirects
 * Automatically detects the current environment (localhost, Vercel, Netlify, etc.)
 */
export function getBaseUrl(): string {
  // Always use the current origin in browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for SSR or other environments (should rarely be used)
  return 'https://degixdaw.vercel.app';
}

/**
 * Get auth callback URL for email redirects
 */
export function getAuthCallbackUrl(): string {
  return `${getBaseUrl()}/auth/callback`;
}

/**
 * Get recovery callback URL for password reset
 */
export function getRecoveryCallbackUrl(): string {
  const url = `${getBaseUrl()}/auth/recover`;
  console.log('🔍 Recovery URL:', JSON.stringify(url), 'Length:', url.length);
  return url.trim(); // Trim any whitespace
}

/**
 * Get email change callback URL for email updates
 */
export function getEmailChangeCallbackUrl(): string {
  return `${getBaseUrl()}/auth/email-confirmed`;
}