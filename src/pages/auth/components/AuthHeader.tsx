// ============================================
// AUTH HEADER COMPONENT
// Header with branding and theme toggle
// ============================================

import type { AuthHeaderProps } from '../types/auth.types';

export default function AuthHeader({ 
  onThemeToggle, 
  isDark, 
  appName, 
  appSubtitle 
}: AuthHeaderProps) {
  return (
    <header className="auth-header">
      <div className="auth-header-content">
        <div className="auth-brand">
          <h1 className="auth-brand-title">🎛️ {appName}</h1>
          <p className="auth-brand-subtitle">{appSubtitle}</p>
        </div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={onThemeToggle}
        className="theme-toggle"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="theme-icon">
          {isDark ? '☀️' : '🌙'}
        </span>
      </button>
    </header>
  );
}
