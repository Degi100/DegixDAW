// ============================================
// FLOATING FILE BROWSER CONTEXT
// Global state management for floating file browser
// ============================================

import { createContext, useContext, type ReactNode } from 'react';
import { useFloatingFileBrowser, type UseFloatingFileBrowserReturn } from '../hooks/useFloatingFileBrowser';

const FloatingFileBrowserContext = createContext<UseFloatingFileBrowserReturn | undefined>(undefined);

export function FloatingFileBrowserProvider({ children }: { children: ReactNode }) {
  const floatingFileBrowser = useFloatingFileBrowser();

  return (
    <FloatingFileBrowserContext.Provider value={floatingFileBrowser}>
      {children}
    </FloatingFileBrowserContext.Provider>
  );
}

export function useFloatingFileBrowserContext() {
  const context = useContext(FloatingFileBrowserContext);
  if (!context) {
    throw new Error('useFloatingFileBrowserContext must be used within FloatingFileBrowserProvider');
  }
  return context;
}
