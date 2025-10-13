/**
 * LanguageSelector Component
 *
 * Toggle between supported languages (DE/EN)
 * Compact dropdown that appears on hover/click
 */

import React, { useState, useRef, useEffect } from 'react';
import type { SupportedLanguage } from '../../lib/services/speech/types';
import { SUPPORTED_LANGUAGES, getSupportedLanguages } from '../../lib/services/speech/config';

interface LanguageSelectorProps {
  /** Current language */
  currentLanguage: SupportedLanguage;

  /** Callback when language is changed */
  onLanguageChange: (language: SupportedLanguage) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Custom class name */
  className?: string;

  /** Show as compact button (default: true) */
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  disabled = false,
  className = '',
  compact = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = getSupportedLanguages();
  const currentConfig = SUPPORTED_LANGUAGES[currentLanguage];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageSelect = (language: SupportedLanguage) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  if (compact) {
    return (
      <div
        ref={dropdownRef}
        className={`language-selector language-selector--compact ${className} ${
          disabled ? 'language-selector--disabled' : ''
        }`}
      >
        <button
          type="button"
          className="language-selector__button"
          onClick={toggleDropdown}
          disabled={disabled}
          title={`Sprache: ${currentConfig.label}`}
        >
          <span className="language-selector__flag">{currentConfig.flag}</span>
          <span className="language-selector__code">{currentLanguage.split('-')[0].toUpperCase()}</span>
        </button>

        {isOpen && (
          <div className="language-selector__dropdown">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`language-selector__option ${
                  lang.code === currentLanguage ? 'language-selector__option--active' : ''
                }`}
                onClick={() => handleLanguageSelect(lang.code)}
              >
                <span className="language-selector__flag">{lang.flag}</span>
                <span className="language-selector__label">{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full mode (not compact)
  return (
    <div className={`language-selector ${className}`}>
      <label className="language-selector__label-text">Sprache:</label>
      <div className="language-selector__buttons">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={`language-selector__button ${
              lang.code === currentLanguage ? 'language-selector__button--active' : ''
            }`}
            onClick={() => handleLanguageSelect(lang.code)}
            disabled={disabled}
          >
            <span className="language-selector__flag">{lang.flag}</span>
            <span className="language-selector__label">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;