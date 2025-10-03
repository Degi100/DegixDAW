// src/lib/urlUtils.ts

/**
 * Get the base URL for redirects
 * Uses production URL in deployed environment, localhost for development
 */
export function getBaseUrl(): string {
  // Check if we're in a deployed environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If localhost or development environment, use current origin
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return window.location.origin;
    }
    
    // Production environment - use the deployed URL
    return 'https://degix.netlify.app';
  }
  
  // Fallback for SSR or other environments
  return 'https://degix.netlify.app';
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