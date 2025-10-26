// ============================================
// GLOBAL HEADER COMPONENT
// corporate Theme - Consistent Navigation
// ============================================

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useAdmin } from '../../hooks/useAdmin';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useChatSounds } from '../../lib/sounds/chatSounds';
import Button from '../ui/Button';
import UserDropdown from './UserDropdown';
import HeaderNav from './HeaderNav';
import { APP_CONFIG } from '../../lib/constants';
import { canAccessFeature, getUserRole } from '../../lib/services/featureFlags';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
  featureFlag?: string; // Optional: Feature-Flag ID
}

interface HeaderProps {
  customBrand?: {
    icon: string;
    name: string;
  };
  customNavItems?: NavigationItem[];
  showAdminBadge?: boolean;
  adminLevel?: string;
  onChatToggle?: (() => void) | undefined;
  unreadChatCount?: number;
  expandedChatId?: string | null;
}
const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Dashboard', icon: '🏠', requiresAuth: true, featureFlag: 'dashboard' },
  { path: '/social', label: 'Social', icon: '👥', requiresAuth: true, featureFlag: 'social_features' },
  { path: '/projects', label: 'Projects', icon: '🎵', requiresAuth: true },
  {
    path: '/files',
    label: 'Dateien',
    icon: '📂',
    requiresAuth: true,
    featureFlag: 'file_browser' // 🔒 Admin-only Feature
  },
];

export default function Header(props: HeaderProps) {
    const {
      customBrand,
      customNavItems,
      showAdminBadge = false,
      adminLevel,
      onChatToggle,
      unreadChatCount = 0,
      expandedChatId = null,
    } = props;
  const { success } = useToast();
  const { isAdmin, isModerator } = useAdmin();
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { features } = useFeatureFlags(); // Load features for navigation
  const { setEnabled: setSoundsEnabled } = useChatSounds();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [soundsEnabled, setSoundsEnabledState] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('soundsEnabled');
    return saved !== null ? saved === 'true' : false; // Default: OFF
  });
  // Animation-Flag für neue ungelesene Nachrichten im Header
  const [isBadgeNew, setIsBadgeNew] = useState(false);
  const prevUnread = useRef(0);

  // Sync sound state with chatSounds on mount
  useEffect(() => {
    setSoundsEnabled(soundsEnabled);
  }, [setSoundsEnabled, soundsEnabled]);

  // Trigger Animation nur bei echter neuer Nachricht und wenn Chat nicht offen
  useEffect(() => {
    if (unreadChatCount > prevUnread.current && !expandedChatId) {
      setIsBadgeNew(true);
      const timeout = setTimeout(() => setIsBadgeNew(false), 2000);
      return () => clearTimeout(timeout);
    }
    prevUnread.current = unreadChatCount;
    // Wenn alles gelesen, Animation zurücksetzen
    if (unreadChatCount === 0) setIsBadgeNew(false);
  }, [unreadChatCount, expandedChatId]);

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleSoundToggle = useCallback(() => {
    const newState = !soundsEnabled;
    setSoundsEnabledState(newState);
    setSoundsEnabled(newState);
    // Persist to localStorage
    localStorage.setItem('soundsEnabled', String(newState));
  }, [soundsEnabled, setSoundsEnabled]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      success('Erfolgreich abgemeldet! 👋');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [signOut, success]);

  const filteredNavItems = useMemo(() => {
    // TODO: Get isModerator from user profile
    const isModerator = false;  // Will be implemented with proper auth
    const userRole = user ? getUserRole(!!user, isAdmin, isModerator) : 'public';

    // Wait for features to load before filtering
    if (features.length === 0) {
      // Return items without feature flags while loading
      return (customNavItems || navigationItems).filter(item => {
        if (item.requiresAuth && !user) return false;
        if (item.featureFlag) return false; // Hide feature-flagged items while loading
        return true;
      });
    }

    return (customNavItems || navigationItems).filter(item => {
      // Auth check
      if (item.requiresAuth && !user) return false;

      // Feature-Flag check
      if (item.featureFlag) {
        const feature = features.find(f => f.id === item.featureFlag);
        return canAccessFeature(feature, userRole, isAdmin);
      }

      return true;
    });
  }, [customNavItems, user, isAdmin, features]);

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
          {/* Chat Toggle Button */}
          {user && onChatToggle && (
            <button
              onClick={onChatToggle}
              className="chat-toggle-btn"
              aria-label="Chat öffnen"
              title={unreadChatCount > 0 ? `${unreadChatCount} ungelesene Nachricht${unreadChatCount > 1 ? 'en' : ''}` : 'Chat öffnen'}
            >
              <span className="chat-icon">💬</span>
              {unreadChatCount > 0 && !expandedChatId && (
                <span className={`chat-badge${isBadgeNew ? ' chat-badge--new' : ''}`}>{unreadChatCount}</span>
              )}
            </button>
          )}

          {user ? (
            <UserDropdown
              user={user}
              isAdmin={isAdmin}
              isModerator={isModerator}
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
          onClick={handleSoundToggle}
          className="sound-toggle"
          aria-label={`${soundsEnabled ? 'Disable' : 'Enable'} sounds`}
          title={`Sounds ${soundsEnabled ? 'aus' : 'ein'}schalten`}
        >
          <span className="sound-icon">
            {soundsEnabled ? '🔊' : '🔇'}
          </span>
        </button>

        <button
          onClick={handleThemeToggle}
          className="theme-toggle"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`${isDark ? 'Light' : 'Dark'} Mode aktivieren`}
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