// ============================================
// USER DROPDOWN COMPONENT
// Corporate Theme - User Menu with Settings & Logout
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { useAvatar } from '../../hooks/useAvatar';
import Avatar from '../ui/Avatar';

interface UserDropdownProps {
  user: User;
  isAdmin: boolean;
  isModerator?: boolean;  // Optional für Moderatoren
  onLogout: () => void;
}

export default function UserDropdown({ user, isAdmin, isModerator = false, onLogout }: UserDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (action: 'settings' | 'admin' | 'logout') => {
    setIsOpen(false);
    switch (action) {
      case 'settings':
        navigate('/settings');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'logout':
        onLogout();
        break;
    }
  };

  const getUserDisplayName = (user: User): string => {
    return (
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
      user.user_metadata?.username ||
      user.user_metadata?.email ||
      'User'
    );
  };

  const avatar = useAvatar(user);

  return (
    <div className="user-menu-container">
      <button
        onClick={toggleMenu}
        className="user-menu-trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar {...avatar} size="medium" shape="circle" />
        <span className="user-name">
          {getUserDisplayName(user)}
        </span>
        <span className="dropdown-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              <div className="dropdown-user-name">
                {getUserDisplayName(user)}
              </div>
              <div className="dropdown-user-email">{user.email}</div>
            </div>
          </div>

          <div className="dropdown-menu">
            <button
              onClick={() => handleItemClick('settings')}
              className="dropdown-item"
            >
              <span className="dropdown-icon">⚙️</span>
              <span>Settings</span>
            </button>

            {(isAdmin || isModerator) && (
              <button
                onClick={() => handleItemClick('admin')}
                className="dropdown-item"
              >
                <span className="dropdown-icon">🛡️</span>
                <span>Admin Panel</span>
              </button>
            )}

            <hr className="dropdown-divider" />

            <button
              onClick={() => handleItemClick('logout')}
              className="dropdown-item logout-item"
            >
              <span className="dropdown-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}