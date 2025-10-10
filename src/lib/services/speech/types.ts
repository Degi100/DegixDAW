/**
 * Speech-to-Text Service Types
 *
 * Type definitions for the speech recognition service
 */

// ============================================================================
// Supported Languages
// ============================================================================

export type SupportedLanguage = 'de-DE' | 'en-US';

export interface LanguageConfig {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

// ============================================================================
// Speech Recognition States
// ============================================================================

export type SpeechRecognitionState =
  | 'idle'        // Not recording
  | 'listening'   // Recording in progress
  | 'processing'  // Processing audio (brief state)
  | 'error';      // Error occurred

// ============================================================================
// Transcript Types
// ============================================================================

export interface TranscriptResult {
  /** Final transcript text (after speech has ended) */
  finalTranscript: string;

  /** Interim transcript text (while user is speaking) */
  interimTranscript: string;

  /** Combined transcript (final + interim) */
  fullTranscript: string;

  /** Timestamp when transcript was generated */
  timestamp: Date;

  /** Language used for recognition */
  language: SupportedLanguage;
}

// ============================================================================
// Speech Recognition Configuration
// ============================================================================

export interface SpeechRecognitionConfig {
  /** Language to use for recognition */
  language?: SupportedLanguage;

  /** Enable continuous recognition (default: true) */
  continuous?: boolean;

  /** Enable interim results while speaking (default: true) */
  interimResults?: boolean;

  /** Auto-stop after silence (default: true) */
  autoStop?: boolean;

  /** Delay before auto-stop in milliseconds (default: 3000) */
  autoStopDelay?: number;

  /** Maximum recording duration in milliseconds (default: 60000 = 1 minute) */
  maxDuration?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export type SpeechRecognitionErrorCode =
  | 'not-supported'           // Browser doesn't support Speech Recognition
  | 'permission-denied'       // Microphone permission denied
  | 'no-speech'              // No speech detected
  | 'network-error'          // Network error (API requires internet)
  | 'aborted'                // Recognition aborted by user
  | 'audio-capture'          // Audio capture failed
  | 'timeout'                // Auto-stop timeout reached
  | 'max-duration-exceeded'  // Maximum recording duration exceeded
  | 'unknown';               // Unknown error

export interface SpeechRecognitionError {
  code: SpeechRecognitionErrorCode;
  message: string;
  originalError?: Error | undefined;
}

// ============================================================================
// Event Handlers
// ============================================================================

export interface SpeechRecognitionEventHandlers {
  /** Called when recognition starts */
  onStart?: () => void;

  /** Called when recognition ends */
  onEnd?: () => void;

  /** Called when interim or final transcript is available */
  onTranscript?: (result: TranscriptResult) => void;

  /** Called when an error occurs */
  onError?: (error: SpeechRecognitionError) => void;

  /** Called when state changes */
  onStateChange?: (state: SpeechRecognitionState) => void;
}

// ============================================================================
// Service Interface
// ============================================================================

export interface SpeechRecognitionService {
  /** Current recognition state */
  state: SpeechRecognitionState;

  /** Current language */
  language: SupportedLanguage;

  /** Check if browser supports speech recognition */
  isSupported: boolean;

  /** Current transcript result */
  transcript: TranscriptResult | null;

  /** Current error (if any) */
  error: SpeechRecognitionError | null;

  /** Start speech recognition */
  start: (config?: SpeechRecognitionConfig) => Promise<void>;

  /** Stop speech recognition */
  stop: () => void;

  /** Abort speech recognition */
  abort: () => void;

  /** Reset transcript */
  resetTranscript: () => void;

  /** Switch language */
  switchLanguage: (language: SupportedLanguage) => void;

  /** Register event handlers */
  on: (handlers: SpeechRecognitionEventHandlers) => void;
}

// ============================================================================
// React Hook Return Type
// ============================================================================

export interface UseSpeechToTextReturn {
  /** Is currently listening */
  isListening: boolean;

  /** Current state */
  state: SpeechRecognitionState;

  /** Final transcript (after speech ended) */
  finalTranscript: string;

  /** Interim transcript (while speaking) */
  interimTranscript: string;

  /** Full transcript (final + interim) */
  transcript: string;

  /** Current language */
  language: SupportedLanguage;

  /** Current error (if any) */
  error: SpeechRecognitionError | null;

  /** Browser supports speech recognition */
  browserSupportsSpeech: boolean;

  /** Start listening */
  startListening: (language?: SupportedLanguage) => Promise<void>;

  /** Stop listening */
  stopListening: () => void;

  /** Reset transcript */
  resetTranscript: () => void;

  /** Switch language */
  switchLanguage: (language: SupportedLanguage) => void;
}