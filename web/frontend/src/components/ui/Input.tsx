// src/components/ui/Input.tsx
import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  showPasswordToggle?: boolean;
  required?: boolean;
  showCheckmark?: boolean;
  conditionalRequired?: boolean; // Für Felder die abhängig von anderen Feldern erforderlich sind
}

export default function Input({ 
  label, 
  error, 
  helpText, 
  showPasswordToggle = false,
  required = false,
  showCheckmark = false,
  conditionalRequired = false,
  className = '', 
  type,
  value,
  ...props 
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  // Determine the actual input type
  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : type;
  
  // Check field state for validation indicators
  const fieldValue = value || '';
  const hasValue = fieldValue && fieldValue.toString().trim().length > 0;
  const hasError = error && error.trim().length > 0;
  
  // Validation-based indicator logic
  const isFieldRequired = required || conditionalRequired;
  const shouldShowStar = isFieldRequired && (!hasValue || hasError);
  const shouldShowCheckmark = showCheckmark && isFieldRequired && hasValue && !hasError;
  
  // Check if we need right padding for indicators
  const hasRightIndicators = showPasswordToggle || shouldShowStar || shouldShowCheckmark;
  
  const inputClasses = [
    'input',
    error && 'input-error',
    hasRightIndicators && 'input-with-right-indicators',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
          {required && <span className="input-required"> *</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input 
          className={inputClasses} 
          type={inputType}
          value={value}
          {...props} 
        />
        {/* All indicators on the right side */}
        <div className="input-indicators input-indicators-right">
          {/* Password toggle (left of validation icons) */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              className="input-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Passwort verstecken' : 'Passwort anzeigen'}
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="eye-icon"
              >
                {showPassword ? (
                  // Eye-off icon (password hidden)
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </>
                ) : (
                  // Eye icon (password visible)
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </>
                )}
              </svg>
            </button>
          )}
          
          {/* Validation indicators (right of password toggle) */}
          {shouldShowStar && (
            <span 
              className="input-required-indicator" 
              aria-label="Pflichtfeld - nicht ausgefüllt oder fehlerhaft"
            >
              *
            </span>
          )}
          {shouldShowCheckmark && (
            <span 
              className="input-checkmark" 
              aria-label="Feld korrekt ausgefüllt"
            >
              ✓
            </span>
          )}
        </div>
      </div>
      {error && (
        <div className="input-error-message">
          {error}
        </div>
      )}
      {helpText && !error && (
        <div className="input-help">
          {helpText}
        </div>
      )}
    </div>
  );
}