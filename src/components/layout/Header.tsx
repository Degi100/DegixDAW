// ============================================
// GLOBAL HEADER COMPONENT
// corporate Theme - Consistent Navigation
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useAdmin } from '../../hooks/useAdmin';
import Button from '../ui/Button';
import UserDropdown from './UserDropdown';
import HeaderNav from './HeaderNav';
import { APP_CONFIG } from '../../lib/constants';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}

interface HeaderProps {
  customBrand?: {
    icon: string;
    name: string;
  };
  customNavItems?: NavigationItem[];
  showAdminBadge?: boolean;
  adminLevel?: string;
  onChatToggle?: () => void;
  unreadChatCount?: number;
}

const navigationItems: NavigationItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠', requiresAuth: true },
  { path: '/social', label: 'Social', icon: '👥', requiresAuth: true },
];

export default function Header({
  customBrand,
  customNavItems,
  showAdminBadge = false,
  adminLevel,
  onChatToggle,
  unreadChatCount = 0
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { success } = useToast();
  const { isAdmin } = useAdmin();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      success('Erfolgreich abgemeldet! 👋');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [signOut, success]);

  const filteredNavItems = useMemo(() => 
    (customNavItems || navigationItems).filter(item =>
      !item.requiresAuth || user
    ), [customNavItems, user]
  );

  const currentBrand = useMemo(() => 
    customBrand || { icon: '🎛️', name: APP_CONFIG.name }, 
    [customBrand]
  );

  return (
    <header className="global-header">
      <div className="header-container header-row">
        {/* Alles in einer Reihe: Branding (Icon), Navigation, User, Theme */}
        <div className="brand-container">
          <Link
            to="/dashboard"
            className="brand-link compact"
            aria-label="Go to Dashboard"
          >
            <span className="brand-icon">{currentBrand.icon}</span>
            {showAdminBadge && adminLevel && adminLevel.trim() && (
              <span className="admin-badge compact">{adminLevel.replace('_', ' ')}</span>
            )}
          </Link>
          <span className="app-version">v{APP_CONFIG.version}</span>
        </div>

        <HeaderNav navItems={filteredNavItems} />

        <div className="header-actions">
          {/* Chat Toggle Button */}
          {user && onChatToggle && (
            <button
              onClick={onChatToggle}
              className="chat-toggle-btn"
              aria-label="Chat öffnen"
            >
              <span className="chat-icon">💬</span>
              {unreadChatCount > 0 && (
                <span className="chat-badge">{unreadChatCount}</span>
              )}
            </button>
          )}

          {user ? (
            <UserDropdown
              user={user}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          ) : (
            <Button
              onClick={() => window.location.href = '/'}
              variant="primary"
              size="small"
            >
              Login
            </Button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-toggle"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            <span className="hamburger-icon">
              {isMobileMenuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>

        <button
          onClick={handleThemeToggle}
          className="theme-toggle"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="theme-icon">
            {isDark ? '☀️' : '🌙'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-menu">
          <nav className="mobile-nav">
            <ul className="mobile-nav-list">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}