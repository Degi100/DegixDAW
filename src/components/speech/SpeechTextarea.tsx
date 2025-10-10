/**
 * SpeechTextarea Component
 *
 * Textarea with integrated speech-to-text functionality
 * Combines textarea, speech button, and language selector
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { SpeechButton } from './SpeechButton';
import { LanguageSelector } from './LanguageSelector';
import type { SupportedLanguage } from '../../lib/services/speech/types';
import { appendTextToValue, insertTextAtCursor } from '../../lib/services/speech/helpers';

interface SpeechTextareaProps {
  /** Current textarea value */
  value: string;

  /** Callback when value changes */
  onChange: (value: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Default language (default: 'de-DE') */
  defaultLanguage?: SupportedLanguage;

  /** Supported languages (default: ['de-DE', 'en-US']) */
  languages?: SupportedLanguage[];

  /** Auto-stop after silence (default: true) */
  autoStop?: boolean;

  /** Auto-stop delay in ms (default: 3000) */
  autoStopDelay?: number;

  /** Max recording duration in ms (default: 60000) */
  maxDuration?: number;

  /** Insert mode: 'cursor' | 'append' (default: 'cursor') */
  insertMode?: 'cursor' | 'append';

  /** Show language selector (default: true) */
  showLanguageSelector?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Custom class name */
  className?: string;

  /** Textarea rows (default: 4) */
  rows?: number;

  /** Additional textarea props */
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export const SpeechTextarea: React.FC<SpeechTextareaProps> = ({
  value,
  onChange,
  placeholder = 'Gib Text ein oder nutze die Spracherkennung...',
  defaultLanguage = 'de-DE',
  languages = ['de-DE', 'en-US'],
  autoStop = true,
  autoStopDelay = 3000,
  maxDuration = 60000,
  insertMode = 'cursor',
  showLanguageSelector = true,
  disabled = false,
  className = '',
  rows = 4,
  textareaProps = {},
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Speech-to-text hook
  const {
    isListening,
    state,
    finalTranscript,
    language,
    error,
    browserSupportsSpeech,
    startListening,
    stopListening,
    resetTranscript,
    switchLanguage,
  } = useSpeechToText({
    language: defaultLanguage,
    autoStop,
    autoStopDelay,
    maxDuration,
    continuous: true,
    interimResults: true,
  });

  // ============================================================================
  // Transcript Handling
  // ============================================================================

  // Insert transcript into textarea when final transcript changes
  useEffect(() => {
    if (!finalTranscript) return;

    let newValue: string;

    if (insertMode === 'cursor' && textareaRef.current) {
      // Insert at cursor position
      newValue = insertTextAtCursor(textareaRef.current, finalTranscript);
    } else {
      // Append to end
      newValue = appendTextToValue(value, finalTranscript);
    }

    // Update value
    onChange(newValue);

    // Reset transcript after insertion
    resetTranscript();
  }, [finalTranscript, insertMode, value, onChange, resetTranscript]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleSpeechButtonClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleLanguageChange = useCallback(
    (newLanguage: SupportedLanguage) => {
      switchLanguage(newLanguage);
    },
    [switchLanguage]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // ============================================================================
  // Render
  // ============================================================================

  const isSpeechDisabled = disabled || !browserSupportsSpeech;

  return (
    <div className={`speech-textarea ${className}`}>
      {/* Textarea */}
      <div className="speech-textarea__wrapper">
        <textarea
          ref={textareaRef}
          className="speech-textarea__input"
          value={value}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          {...textareaProps}
        />

        {/* Controls (Speech Button + Language Selector) */}
        <div className="speech-textarea__controls">
          {/* Speech Button */}
          <SpeechButton
            state={state}
            isListening={isListening}
            onClick={handleSpeechButtonClick}
            disabled={isSpeechDisabled}
            className="speech-textarea__button"
          />

          {/* Language Selector */}
          {showLanguageSelector && languages.length > 1 && (
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
              disabled={isSpeechDisabled || isListening}
              className="speech-textarea__language"
              compact
            />
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="speech-textarea__error">
          <span className="speech-textarea__error-icon">⚠️</span>
          <span className="speech-textarea__error-message">{error.message}</span>
        </div>
      )}

      {/* Browser Not Supported Warning */}
      {!browserSupportsSpeech && (
        <div className="speech-textarea__warning">
          <span className="speech-textarea__warning-icon">ℹ️</span>
          <span className="speech-textarea__warning-message">
            Spracherkennung wird von deinem Browser nicht unterstützt.
          </span>
        </div>
      )}
    </div>
  );
};

export default SpeechTextarea;