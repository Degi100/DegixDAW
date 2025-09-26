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
  
  // Check if we need right padding for indicators (more space for multiple icons)
  const hasMultipleIcons = showPasswordToggle && (shouldShowStar || shouldShowCheckmark);
  const hasRightIndicator = showPasswordToggle || shouldShowStar || shouldShowCheckmark;
  
  const inputClasses = [
    'input',
    error && 'input-error',
    hasMultipleIcons && 'input-with-multiple-icons',
    hasRightIndicator && !hasMultipleIcons && 'input-with-indicator',
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
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className={`input-toggle ${hasMultipleIcons ? 'input-toggle-with-others' : ''}`}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Passwort verstecken' : 'Passwort anzeigen'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
        {shouldShowStar && (
          <span 
            className={`input-required-indicator ${showPasswordToggle ? 'input-indicator-with-toggle' : ''}`} 
            aria-label="Pflichtfeld - nicht ausgefüllt oder fehlerhaft"
          >
            *
          </span>
        )}
        {shouldShowCheckmark && (
          <span 
            className={`input-checkmark ${showPasswordToggle ? 'input-indicator-with-toggle' : ''}`} 
            aria-label="Feld korrekt ausgefüllt"
          >
            ✓
          </span>
        )}
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