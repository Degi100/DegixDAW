// ============================================
// GLOBAL HEADER COMPONENT
// Corporate Theme - Consistent Navigation
// ============================================

import { useState } from 'react';
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
}

const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Dashboard', icon: '🏠', requiresAuth: true },
];

export default function Header({
  customBrand,
  customNavItems,
  showAdminBadge = false,
  adminLevel
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { success } = useToast();
  const { isAdmin } = useAdmin();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      success('Successfully logged out! 👋');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredNavItems = (customNavItems || navigationItems).filter(item =>
    !item.requiresAuth || user
  );

  const currentBrand = customBrand || { icon: '🎛️', name: APP_CONFIG.name };

  return (
    <header className="global-header">
      <div className="header-container header-row">
        {/* Alles in einer Reihe: Branding (Icon), Navigation, User, Theme */}
        <div className="brand-container">
          <Link
            to="/"
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