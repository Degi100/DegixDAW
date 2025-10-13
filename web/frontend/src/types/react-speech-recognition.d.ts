/**
 * Type Definitions for react-speech-recognition
 *
 * Module declaration for react-speech-recognition package
 */

declare module 'react-speech-recognition' {
  export interface UseSpeechRecognitionReturn {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export interface StartListeningOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }

  export function useSpeechRecognition(): UseSpeechRecognitionReturn;

  const SpeechRecognition: {
    startListening: (options?: StartListeningOptions) => Promise<void>;
    stopListening: () => void;
    abortListening: () => void;
    resetTranscript: () => void;
  };

  export default SpeechRecognition;
}