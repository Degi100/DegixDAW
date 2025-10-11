/**
 * Speech-to-Text Configuration
 *
 * Language settings and default configuration
 */

import type { LanguageConfig, SupportedLanguage, SpeechRecognitionConfig } from './types';

// ============================================================================
// Language Configuration
// ============================================================================

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  'de-DE': {
    code: 'de-DE',
    label: 'Deutsch',
    flag: '🇩🇪',
  },
  'en-US': {
    code: 'en-US',
    label: 'English',
    flag: '🇺🇸',
  },
};

/**
 * Get all supported languages as array
 */
export const getSupportedLanguages = (): LanguageConfig[] => {
  return Object.values(SUPPORTED_LANGUAGES);
};

/**
 * Get language config by code
 */
export const getLanguageConfig = (code: SupportedLanguage): LanguageConfig => {
  return SUPPORTED_LANGUAGES[code];
};

/**
 * Check if language is supported
 */
export const isLanguageSupported = (code: string): code is SupportedLanguage => {
  return code in SUPPORTED_LANGUAGES;
};

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: Required<SpeechRecognitionConfig> = {
  language: 'de-DE',
  continuous: true,
  interimResults: true,
  autoStop: true,
  autoStopDelay: 3000,
  maxDuration: 60000, // 1 minute
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  'not-supported': 'Dein Browser unterstützt keine Spracherkennung. Bitte verwende Chrome, Edge oder Safari.',
  'permission-denied': 'Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.',
  'no-speech': 'Keine Sprache erkannt. Bitte versuche es erneut.',
  'network-error': 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.',
  'aborted': 'Aufnahme wurde abgebrochen.',
  'audio-capture': 'Fehler beim Zugriff auf das Mikrofon.',
  'timeout': 'Aufnahme wurde automatisch nach Stille beendet.',
  'max-duration-exceeded': 'Maximale Aufnahmedauer überschritten.',
  'unknown': 'Ein unbekannter Fehler ist aufgetreten.',
} as const;

/**
 * Get localized error message
 */
export const getErrorMessage = (code: keyof typeof ERROR_MESSAGES): string => {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.unknown;
};

// ============================================================================
// Browser Compatibility
// ============================================================================

/**
 * Check if browser supports Speech Recognition API
 */
export const checkBrowserSupport = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for both prefixed and unprefixed versions
  return !!(
    window.SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
};

/**
 * Get SpeechRecognition constructor (handles prefixes)
 */
export const getSpeechRecognitionConstructor = (): typeof SpeechRecognition | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};