// src/hooks/useToast.ts
// Simplified toast hook using react-hot-toast
// Replaces complex state management with proven library

import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function useToast() {
  // Convenience methods that match our previous API
  const success = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    const displayMessage = options?.title ? `${options.title}\n${message}` : message;
    return toast.success(displayMessage, {
      duration: options?.duration ?? 5000,
    });
  }, []);

  const error = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    const displayMessage = options?.title ? `${options.title}\n${message}` : message;
    return toast.error(displayMessage, {
      duration: options?.duration ?? 7000,
    });
  }, []);

  const warning = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    const displayMessage = options?.title ? `${options.title}\n${message}` : message;
    return toast(displayMessage, {
      duration: options?.duration ?? 5000,
      icon: '⚠️',
    });
  }, []);

  const info = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    const displayMessage = options?.title ? `${options.title}\n${message}` : message;
    return toast(displayMessage, {
      duration: options?.duration ?? 5000,
      icon: 'ℹ️',
    });
  }, []);

  // Return clean interface
  return {
    success,
    error,
    warning,
    info,
  };
}