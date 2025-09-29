// src/components/ui/Toast.tsx
// Simple toast wrapper using react-hot-toast library
// Replaces 301 lines of custom CSS with a 10KB proven library

import { Toaster } from 'react-hot-toast';

// Simple wrapper component for consistent styling
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName="toast-container"
      toastOptions={{
        // Default styling that matches our design system
        duration: 5000,
        style: {
          background: 'var(--white)',
          color: 'var(--text-primary)',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontSize: 'var(--font-size-sm)',
          padding: 'var(--spacing-md)',
        },
        // Success styling
        success: {
          style: {
            borderLeft: '4px solid var(--success-color)',
            backgroundColor: 'var(--success-50, #f0fdf4)',
          },
          iconTheme: {
            primary: 'var(--success-color)',
            secondary: 'var(--white)',
          },
        },
        // Error styling  
        error: {
          style: {
            borderLeft: '4px solid var(--error-color)',
            backgroundColor: 'var(--error-50, #fef2f2)',
          },
          iconTheme: {
            primary: 'var(--error-color)',
            secondary: 'var(--white)',
          },
          duration: 7000,
        },
      }}
    />
  );
}