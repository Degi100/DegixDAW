// ============================================
// APP LAYOUT COMPONENT
// Corporate Theme - Global Layout with Header
// ============================================

import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  // Pages that don't need the header (auth pages, etc.)
  const authPages = ['/auth', '/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authPages.some(path => location.pathname.startsWith(path));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}