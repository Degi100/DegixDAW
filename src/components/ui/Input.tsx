// src/components/ui/Input.tsx
import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export default function Input({ 
  label, 
  error, 
  helpText, 
  className = '', 
  ...props 
}: InputProps) {
  const inputClasses = [
    styles.input,
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label className={styles.label} htmlFor={props.id}>
          {label}
        </label>
      )}
      <input 
        className={inputClasses} 
        {...props} 
      />
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