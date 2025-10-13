// src/hooks/useFormToggle.ts
import { useState, useCallback } from 'react';

interface FormToggleConfig {
  /** Initial state - true for first option, false for second */
  initialState?: boolean;
  /** Callback executed when toggle switches (e.g., to reset forms) */
  onToggle?: (newState: boolean) => void;
}

interface FormToggleLabels {
  /** Labels for the main action (e.g., form titles, button texts) */
  primary: {
    true: string;   // When toggle is true
    false: string;  // When toggle is false
  };
  /** Labels for the toggle prompt and button */
  toggle: {
    promptTrue: string;   // "Noch kein Account?"
    promptFalse: string;  // "Bereits ein Account?"
    actionTrue: string;   // "Hier registrieren"
    actionFalse: string;  // "Hier anmelden"
  };
}

/**
 * Reusable hook for form toggle patterns (Login/Signup, Edit/View, etc.)
 * Provides state management and consistent labeling for binary form modes
 */
export function useFormToggle(config: FormToggleConfig = {}) {
  const { initialState = true, onToggle } = config;
  const [isFirstOption, setIsFirstOption] = useState(initialState);

  const toggle = useCallback(() => {
    const newState = !isFirstOption;
    setIsFirstOption(newState);
    onToggle?.(newState);
  }, [isFirstOption, onToggle]);

  const reset = useCallback(() => {
    setIsFirstOption(initialState);
  }, [initialState]);

  return {
    /** Current toggle state */
    isFirstOption,
    /** Toggle to the other option */
    toggle,
    /** Reset to initial state */
    reset,
    /** Manual state setter */
    setIsFirstOption,
  };
}

/**
 * Helper function to generate consistent toggle UI labels
 */
export function getToggleLabels(
  labels: FormToggleLabels,
  isFirstOption: boolean
) {
  return {
    /** Primary action label (form title, button text) */
    primaryLabel: labels.primary[isFirstOption ? 'true' : 'false'],
    /** Toggle prompt text */
    promptLabel: labels.toggle[isFirstOption ? 'promptTrue' : 'promptFalse'],
    /** Toggle action text */
    actionLabel: labels.toggle[isFirstOption ? 'actionTrue' : 'actionFalse'],
  };
}

/**
 * Pre-configured labels for Login/Signup toggle
 */
export const LOGIN_SIGNUP_LABELS: FormToggleLabels = {
  primary: {
    true: 'Anmelden',
    false: 'Registrieren',
  },
  toggle: {
    promptTrue: 'Noch kein Account?',
    promptFalse: 'Bereits ein Account?',
    actionTrue: 'Hier registrieren',
    actionFalse: 'Hier anmelden',
  },
};