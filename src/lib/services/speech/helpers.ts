/**
 * Speech-to-Text Helpers
 *
 * Utility functions for speech recognition
 */

import type {
  SpeechRecognitionError,
  SpeechRecognitionErrorCode,
  TranscriptResult,
  SupportedLanguage,
} from './types';
import { getErrorMessage } from './config';

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Map native SpeechRecognitionError to our custom error type
 */
export const mapSpeechRecognitionError = (
  error: SpeechRecognitionErrorEvent | Error | unknown
): SpeechRecognitionError => {
  // Handle SpeechRecognitionErrorEvent
  if (error && typeof error === 'object' && 'error' in error) {
    const evt = error as SpeechRecognitionErrorEvent;
    const code = mapErrorCode(evt.error);
    return {
      code,
      message: getErrorMessage(code),
      originalError: evt as any,
    };
  }

  // Handle generic Error
  if (error instanceof Error) {
    return {
      code: 'unknown',
      message: error.message || getErrorMessage('unknown'),
      originalError: error,
    };
  }

  // Fallback
  return {
    code: 'unknown',
    message: getErrorMessage('unknown'),
  };
};

/**
 * Map native error code to our custom error code
 */
const mapErrorCode = (nativeCode: string): SpeechRecognitionErrorCode => {
  const errorMap: Record<string, SpeechRecognitionErrorCode> = {
    'no-speech': 'no-speech',
    'aborted': 'aborted',
    'audio-capture': 'audio-capture',
    'network': 'network-error',
    'not-allowed': 'permission-denied',
    'service-not-allowed': 'permission-denied',
  };

  return errorMap[nativeCode] || 'unknown';
};

// ============================================================================
// Transcript Formatting
// ============================================================================

/**
 * Create a TranscriptResult object
 */
export const createTranscriptResult = (
  finalTranscript: string,
  interimTranscript: string,
  language: SupportedLanguage
): TranscriptResult => {
  return {
    finalTranscript: finalTranscript.trim(),
    interimTranscript: interimTranscript.trim(),
    fullTranscript: `${finalTranscript} ${interimTranscript}`.trim(),
    timestamp: new Date(),
    language,
  };
};

/**
 * Clean and format transcript text
 */
export const formatTranscript = (text: string): string => {
  return text
    .trim()
    // Capitalize first letter
    .replace(/^\w/, (c) => c.toUpperCase())
    // Ensure proper spacing
    .replace(/\s+/g, ' ');
};

/**
 * Insert text at cursor position in textarea
 */
export const insertTextAtCursor = (
  element: HTMLTextAreaElement,
  text: string
): string => {
  const start = element.selectionStart || 0;
  const end = element.selectionEnd || 0;
  const currentValue = element.value;

  // Insert text at cursor position
  const before = currentValue.substring(0, start);
  const after = currentValue.substring(end);
  const newValue = before + text + after;

  // Set cursor position after inserted text
  const newCursorPosition = start + text.length;
  setTimeout(() => {
    element.setSelectionRange(newCursorPosition, newCursorPosition);
    element.focus();
  }, 0);

  return newValue;
};

/**
 * Append text to existing value (with smart spacing)
 */
export const appendTextToValue = (currentValue: string, newText: string): string => {
  if (!currentValue) {
    return newText;
  }

  // Add space if current value doesn't end with whitespace
  const needsSpace = currentValue.length > 0 && !/\s$/.test(currentValue);
  return needsSpace ? `${currentValue} ${newText}` : `${currentValue}${newText}`;
};

// ============================================================================
// Audio Detection
// ============================================================================

/**
 * Check if there's likely audio input (basic heuristic)
 */
export const hasLikelyAudioInput = (transcript: string, duration: number): boolean => {
  // If we got any transcript within reasonable time, there's audio
  if (transcript.length > 0 && duration < 5000) {
    return true;
  }

  // If no transcript after 5+ seconds, likely no audio
  return false;
};

// ============================================================================
// Debouncing
// ============================================================================

/**
 * Create a debounced function
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// ============================================================================
// Browser Detection
// ============================================================================

/**
 * Detect if running on mobile device
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detect browser name
 */
export const getBrowserName = (): string => {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('chrome')) return 'chrome';
  if (userAgent.includes('safari')) return 'safari';
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('edge')) return 'edge';

  return 'unknown';
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate if text is likely a valid transcript
 */
export const isValidTranscript = (text: string): boolean => {
  // Must have content
  if (!text || text.trim().length === 0) {
    return false;
  }

  // Must not be too short (likely noise)
  if (text.trim().length < 2) {
    return false;
  }

  return true;
};
