/**
 * SpeechButton Component
 *
 * Microphone button with visual states
 * Shows different icons and animations based on speech recognition state
 */

import React from 'react';
import type { SpeechRecognitionState } from '../../lib/services/speech/types';
import { WaveformVisualizer } from './WaveformVisualizer';

interface SpeechButtonProps {
  /** Current speech recognition state */
  state: SpeechRecognitionState;

  /** Is currently listening */
  isListening: boolean;

  /** Click handler to start/stop recording */
  onClick: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Custom class name */
  className?: string;

  /** Show label text (default: false) */
  showLabel?: boolean;

  /** Custom tooltip text */
  tooltip?: string;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  state,
  isListening,
  onClick,
  disabled = false,
  className = '',
  showLabel = false,
  tooltip,
}) => {
  // Determine button state classes
  const stateClass = `speech-button--${state}`;
  const listeningClass = isListening ? 'speech-button--active' : '';
  const disabledClass = disabled ? 'speech-button--disabled' : '';

  // Determine icon based on state
  const getIcon = () => {
    switch (state) {
      case 'listening':
        return null; // Will show waveform instead
      case 'processing':
        return (
          <svg className="speech-button__icon" viewBox="0 0 24 24" fill="none">
            <circle
              className="speech-button__spinner"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="31.415, 31.415"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="speech-button__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'idle':
      default:
        return (
          <svg className="speech-button__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        );
    }
  };

  // Determine button text/label
  const getLabel = () => {
    switch (state) {
      case 'listening':
        return 'Aufnahme...';
      case 'processing':
        return 'Verarbeite...';
      case 'error':
        return 'Fehler';
      case 'idle':
      default:
        return 'Spracherkennung starten';
    }
  };

  // Determine tooltip
  const getTooltip = () => {
    if (tooltip) return tooltip;
    if (disabled) return 'Spracherkennung nicht verfügbar';
    return getLabel();
  };

  return (
    <button
      type="button"
      className={`speech-button ${stateClass} ${listeningClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={getTooltip()}
      aria-label={getLabel()}
    >
      {/* Show waveform when listening, otherwise show icon */}
      {isListening && state === 'listening' ? (
        <WaveformVisualizer isListening={isListening} className="speech-button__waveform" />
      ) : (
        <span className="speech-button__icon-wrapper">{getIcon()}</span>
      )}

      {/* Optional label text */}
      {showLabel && <span className="speech-button__label">{getLabel()}</span>}

      {/* Pulse animation overlay for listening state */}
      {isListening && <span className="speech-button__pulse" />}
    </button>
  );
};

export default SpeechButton;