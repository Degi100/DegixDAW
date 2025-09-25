// src/components/ui/Input.tsx
import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

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
    styles.input,
    error && styles.error,
    hasMultipleIcons && styles.inputWithMultipleIcons,
    hasRightIndicator && !hasMultipleIcons && styles.inputWithIndicator,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label className={styles.label} htmlFor={props.id}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input 
          className={inputClasses} 
          type={inputType}
          value={value}
          {...props} 
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className={`${styles.passwordToggle} ${hasMultipleIcons ? styles.passwordToggleWithOthers : ''}`}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Passwort verstecken' : 'Passwort anzeigen'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
        {shouldShowStar && (
          <span 
            className={`${styles.requiredIndicator} ${showPasswordToggle ? styles.indicatorWithToggle : ''}`} 
            aria-label="Pflichtfeld - nicht ausgefüllt oder fehlerhaft"
          >
            *
          </span>
        )}
        {shouldShowCheckmark && (
          <span 
            className={`${styles.checkmark} ${showPasswordToggle ? styles.indicatorWithToggle : ''}`} 
            aria-label="Feld korrekt ausgefüllt"
          >
            ✓
          </span>
        )}
      </div>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      {helpText && !error && (
        <div className={styles.helpText}>
          {helpText}
        </div>
      )}
    </div>
  );
}