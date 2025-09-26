// src/components/ui/Toast.tsx
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export function ToastItem({ id, type, title, message, duration = 5000, onClose, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove, onClose]);

  const handleClose = () => {
    onRemove(id);
    onClose?.();
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {toastIcons[type]}
      </div>
      
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      
      <button 
        onClick={handleClose}
        className="toast-close"
        aria-label="Toast schließen"
      >
        ×
      </button>
      
      {duration > 0 && (
        <div 
          className={`toast-progress toast-progress-${type}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          {...toast} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  );
}