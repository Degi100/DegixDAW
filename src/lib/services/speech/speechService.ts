/**
 * Speech Recognition Service
 *
 * Core service that wraps react-speech-recognition
 * Provides a clean API for speech-to-text functionality
 */

import SpeechRecognition from 'react-speech-recognition';
import type {
  SpeechRecognitionConfig,
  SpeechRecognitionError,
  SpeechRecognitionErrorCode,
  SupportedLanguage,
  TranscriptResult,
} from './types';
import {
  DEFAULT_CONFIG,
  checkBrowserSupport,
  getErrorMessage,
} from './config';
import {
  createTranscriptResult,
  mapSpeechRecognitionError,
} from './helpers';

// ============================================================================
// Speech Service Class
// ============================================================================

class SpeechService {
  private currentLanguage: SupportedLanguage = DEFAULT_CONFIG.language;
  private autoStopTimeout: ReturnType<typeof setTimeout> | null = null;
  private maxDurationTimeout: ReturnType<typeof setTimeout> | null = null;
  private config: Required<SpeechRecognitionConfig> = DEFAULT_CONFIG;

  /**
   * Check if browser supports speech recognition
   */
  public isSupported(): boolean {
    return checkBrowserSupport();
  }

  /**
   * Get current language
   */
  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Set language for speech recognition
   */
  public setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  /**
   * Start speech recognition
   */
  public async start(config?: Partial<SpeechRecognitionConfig>): Promise<void> {
    // Check browser support
    if (!this.isSupported()) {
      throw this.createError('not-supported');
    }

    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Update language if provided
    if (this.config.language) {
      this.currentLanguage = this.config.language;
    }

    try {
      // Start listening with react-speech-recognition
      await SpeechRecognition.startListening({
        language: this.currentLanguage,
        continuous: this.config.continuous,
        interimResults: this.config.interimResults,
      });

      // Setup auto-stop timeout if enabled
      if (this.config.autoStop && this.config.autoStopDelay > 0) {
        this.setupAutoStopTimeout();
      }

      // Setup max duration timeout
      if (this.config.maxDuration > 0) {
        this.setupMaxDurationTimeout();
      }
    } catch (error) {
      throw mapSpeechRecognitionError(error);
    }
  }

  /**
   * Stop speech recognition
   */
  public stop(): void {
    SpeechRecognition.stopListening();
    this.clearTimeouts();
  }

  /**
   * Abort speech recognition
   */
  public abort(): void {
    SpeechRecognition.abortListening();
    this.clearTimeouts();
  }

  /**
   * Reset transcript
   * Note: This is handled by the useSpeechRecognition hook, not the service
   */
  public resetTranscript(): void {
    // No-op: resetTranscript is handled by the hook's resetTranscript function
    // The SpeechRecognition service doesn't have a resetTranscript method
  }

  /**
   * Create transcript result from current state
   */
  public createTranscriptResult(
    finalTranscript: string,
    interimTranscript: string
  ): TranscriptResult {
    return createTranscriptResult(
      finalTranscript,
      interimTranscript,
      this.currentLanguage
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Setup auto-stop timeout
   * Automatically stops recording after configured delay with no speech
   */
  private setupAutoStopTimeout(): void {
    this.clearAutoStopTimeout();

    this.autoStopTimeout = setTimeout(() => {
      this.stop();
    }, this.config.autoStopDelay);
  }

  /**
   * Reset auto-stop timeout (called when speech is detected)
   */
  public resetAutoStopTimeout(): void {
    if (this.config.autoStop) {
      this.setupAutoStopTimeout();
    }
  }

  /**
   * Clear auto-stop timeout
   */
  private clearAutoStopTimeout(): void {
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }
  }

  /**
   * Setup max duration timeout
   * Automatically stops recording after max duration
   */
  private setupMaxDurationTimeout(): void {
    this.clearMaxDurationTimeout();

    this.maxDurationTimeout = setTimeout(() => {
      this.stop();
    }, this.config.maxDuration);
  }

  /**
   * Clear max duration timeout
   */
  private clearMaxDurationTimeout(): void {
    if (this.maxDurationTimeout) {
      clearTimeout(this.maxDurationTimeout);
      this.maxDurationTimeout = null;
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    this.clearAutoStopTimeout();
    this.clearMaxDurationTimeout();
  }

  /**
   * Create a standardized error object
   */
  private createError(
    code: SpeechRecognitionErrorCode,
    originalError?: Error
  ): SpeechRecognitionError {
    return {
      code,
      message: getErrorMessage(code),
      originalError,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const speechService = new SpeechService();

// ============================================================================
// Convenience Exports
// ============================================================================

export default speechService;