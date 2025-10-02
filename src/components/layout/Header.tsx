// ============================================
// GLOBAL HEADER COMPONENT
// Corporate Theme - Consistent Navigation
// ============================================

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useAdmin } from '../../hooks/useAdmin';
import Button from '../ui/Button';
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
  { path: '/settings', label: 'Settings', icon: '⚙️', requiresAuth: true },
];

export default function Header({ 
  customBrand, 
  customNavItems, 
  showAdminBadge = false, 
  adminLevel 
}: HeaderProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { success } = useToast();
  const { isAdmin } = useAdmin();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dropdownClosing, setDropdownClosing] = useState(false);
  const [activeDropdownItem, setActiveDropdownItem] = useState<string | null>(null);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      success('Successfully logged out! 👋');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const filteredNavItems = (customNavItems || navigationItems).filter(item =>
    !item.requiresAuth || user
  );

  const currentBrand = customBrand || { icon: '🎛️', name: APP_CONFIG.name };

  return (
    <header className="global-header">
      <div className="header-container header-row">
        {/* Alles in einer Reihe: Branding (Icon), Navigation, User, Theme */}
        <button
          onClick={() => handleNavigation('/')}
          className="brand-link compact"
          aria-label="Go to Dashboard"
        >
          <span className="brand-icon">{currentBrand.icon}</span>
          {showAdminBadge && adminLevel && adminLevel.trim() && (
            <span className="admin-badge compact">{adminLevel.replace('_', ' ')}</span>
          )}
        </button>

        <nav className="header-nav">
          <ul className="nav-list">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`nav-link ${isActivePath(item.path) ? 'active' : ''}`}
                  aria-current={isActivePath(item.path) ? 'page' : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-menu-container">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="user-menu-trigger"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {(user.user_metadata?.first_name || user.user_metadata?.full_name || user.user_metadata?.username || user.email)
                    ?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">
                  {user.user_metadata?.display_name ||
                   user.user_metadata?.full_name ||
                   `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                   user.user_metadata?.username ||
                   'User'}
                </span>
                <span className="dropdown-arrow">
                  {isUserMenuOpen ? '▲' : '▼'}
                </span>
              </button>

              {isUserMenuOpen && (
                <div
                  className={`user-dropdown${dropdownClosing ? ' closing' : ''}`}
                  onMouseLeave={() => {
                    setDropdownClosing(true);
                    setTimeout(() => {
                      setIsUserMenuOpen(false);
                      setDropdownClosing(false);
                    }, 250); // Dauer der Animation in ms
                  }}
                >
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">
                        {user.user_metadata?.display_name ||
                         user.user_metadata?.full_name ||
                         `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                         user.user_metadata?.username ||
                         user.user_metadata?.email ||
                         'User'}
                      </div>
                      <div className="dropdown-user-email">{user.email}</div>
                    </div>
                  </div>

                  <div className="dropdown-menu">
                    <button
                      onClick={() => { setActiveDropdownItem('settings'); handleNavigation('/settings'); }}
                      className={`dropdown-item${activeDropdownItem === 'settings' ? ' no-hover' : ''}`}
                      onMouseLeave={() => setActiveDropdownItem(null)}
                    >
                      <span className="dropdown-icon">⚙️</span>
                      <span>Settings</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => { setActiveDropdownItem('admin'); handleNavigation('/admin'); }}
                        className={`dropdown-item${activeDropdownItem === 'admin' ? ' no-hover' : ''}`}
                        onMouseLeave={() => setActiveDropdownItem(null)}
                      >
                        <span className="dropdown-icon">🛡️</span>
                        <span>Admin Panel</span>
                      </button>
                    )}

                    <hr className="dropdown-divider" />

                    <button
                      onClick={() => { setActiveDropdownItem('logout'); handleLogout(); }}
                      className={`dropdown-item logout-item${activeDropdownItem === 'logout' ? ' no-hover' : ''}`}
                      onMouseLeave={() => setActiveDropdownItem(null)}
                    >
                      <span className="dropdown-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => handleNavigation('/')}
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
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`mobile-nav-link ${isActivePath(item.path) ? 'active' : ''}`}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}