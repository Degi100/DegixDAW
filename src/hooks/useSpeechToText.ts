/**
 * useSpeechToText Hook
 *
 * React hook for speech-to-text functionality
 * Provides state management and lifecycle handling
 */

import { useEffect, useCallback, useState } from 'react';
import { useSpeechRecognition } from 'react-speech-recognition';
import { speechService } from '../lib/services/speech/speechService';
import type {
  SupportedLanguage,
  SpeechRecognitionError,
  SpeechRecognitionState,
  UseSpeechToTextReturn,
  SpeechRecognitionConfig,
} from '../lib/services/speech/types';
import { DEFAULT_CONFIG } from '../lib/services/speech/config';
import { formatTranscript, isValidTranscript } from '../lib/services/speech/helpers';

// ============================================================================
// Hook Options
// ============================================================================

interface UseSpeechToTextOptions extends Partial<SpeechRecognitionConfig> {
  /** Callback when transcript is updated */
  onTranscript?: (transcript: string) => void;

  /** Callback when listening starts */
  onStart?: () => void;

  /** Callback when listening stops */
  onStop?: () => void;

  /** Callback when error occurs */
  onError?: (error: SpeechRecognitionError) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useSpeechToText = (
  options: UseSpeechToTextOptions = {}
): UseSpeechToTextReturn => {
  // Destructure options with defaults
  const {
    language: initialLanguage = DEFAULT_CONFIG.language,
    autoStop = DEFAULT_CONFIG.autoStop,
    autoStopDelay = DEFAULT_CONFIG.autoStopDelay,
    continuous = DEFAULT_CONFIG.continuous,
    interimResults = DEFAULT_CONFIG.interimResults,
    maxDuration = DEFAULT_CONFIG.maxDuration,
    onTranscript,
    onStart,
    onStop,
    onError,
  } = options;

  // Use react-speech-recognition hook
  const {
    transcript: rawTranscript,
    interimTranscript: rawInterimTranscript,
    finalTranscript: rawFinalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Local state
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [error, setError] = useState<SpeechRecognitionError | null>(null);
  const [state, setState] = useState<SpeechRecognitionState>('idle');

  // Format transcripts
  const finalTranscript = formatTranscript(rawFinalTranscript);
  const interimTranscript = formatTranscript(rawInterimTranscript);
  const fullTranscript = formatTranscript(rawTranscript);

  // ============================================================================
  // State Management
  // ============================================================================

  // Update state based on listening status
  useEffect(() => {
    if (listening) {
      setState('listening');
    } else if (state === 'listening') {
      setState('idle');
    }
  }, [listening, state]);

  // ============================================================================
  // Auto-Stop Logic
  // ============================================================================

  useEffect(() => {
    if (!listening || !autoStop) {
      return;
    }

    // Reset auto-stop timeout whenever transcript changes
    if (rawTranscript || rawInterimTranscript) {
      speechService.resetAutoStopTimeout();
    }
  }, [rawTranscript, rawInterimTranscript, listening, autoStop]);

  // ============================================================================
  // Transcript Callbacks
  // ============================================================================

  // Notify when final transcript changes
  useEffect(() => {
    if (finalTranscript && isValidTranscript(finalTranscript)) {
      onTranscript?.(finalTranscript);
    }
  }, [finalTranscript, onTranscript]);

  // ============================================================================
  // Core Functions
  // ============================================================================

  /**
   * Start listening
   */
  const startListening = useCallback(
    async (lang?: SupportedLanguage) => {
      // Clear any previous errors
      setError(null);

      // Update language if provided
      const languageToUse = lang || currentLanguage;
      if (lang) {
        setCurrentLanguage(lang);
        speechService.setLanguage(lang);
      }

      try {
        // Start speech recognition
        await speechService.start({
          language: languageToUse,
          continuous,
          interimResults,
          autoStop,
          autoStopDelay,
          maxDuration,
        });

        // Set state to listening
        setState('listening');

        // Trigger onStart callback
        onStart?.();
      } catch (err) {
        // Handle errors
        const speechError = err as SpeechRecognitionError;
        setError(speechError);
        setState('error');
        onError?.(speechError);
      }
    },
    [
      currentLanguage,
      continuous,
      interimResults,
      autoStop,
      autoStopDelay,
      maxDuration,
      onStart,
      onError,
    ]
  );

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    speechService.stop();
    setState('idle');
    onStop?.();
  }, [onStop]);

  /**
   * Switch language
   */
  const switchLanguage = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    speechService.setLanguage(lang);

    // If currently listening, restart with new language
    if (listening) {
      speechService.stop();
      setTimeout(() => {
        speechService.start({ language: lang });
      }, 100);
    }
  }, [listening]);

  /**
   * Reset transcript
   */
  const handleResetTranscript = useCallback(() => {
    resetTranscript();
    setError(null);
  }, [resetTranscript]);

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // State
    isListening: listening,
    state,
    finalTranscript,
    interimTranscript,
    transcript: fullTranscript,
    language: currentLanguage,
    error,
    browserSupportsSpeech: browserSupportsSpeechRecognition,

    // Actions
    startListening,
    stopListening,
    resetTranscript: handleResetTranscript,
    switchLanguage,
  };
};

export default useSpeechToText;
