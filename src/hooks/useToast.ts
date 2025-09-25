// src/hooks/useToast.ts
import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '../components/ui/Toast';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    options?: {
      title?: string;
      duration?: number;
      onClose?: () => void;
    }
  ) => {
    const id = `toast-${++toastId}`;
    const toast: Toast = {
      id,
      type,
      message,
      title: options?.title,
      duration: options?.duration ?? 5000,
      onClose: options?.onClose,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const error = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, 'error', { duration: 7000, ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const info = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
}