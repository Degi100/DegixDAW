// src/components/admin/AdminLayoutCorporate.tsx
// Ultimate Corporate Professional Admin Layout

import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';

interface AdminLayoutProps {
  children: ReactNode;
}



const navItems = [
  { path: "/admin", icon: "📊", label: "Dashboard" },
  { path: "/admin/users", icon: "👥", label: "Users" },
  { path: "/admin/settings", icon: "⚙️", label: "Settings" }
];

export default function AdminLayoutCorporate({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { adminLevel } = useAdmin();
  const { isDark, toggleTheme } = useTheme();
  const { success } = useToast();

  const handleThemeToggle = () => {
    toggleTheme();
    success(`Switched to ${isDark ? 'Light' : 'Dark'} mode! 🎨`);
  };

  const handleLogout = async () => {
  await signOut();
  navigate('/dashboard');
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1>🎛️ Admin Panel</h1>
            <span className="admin-badge">{adminLevel.replace('_', ' ')}</span>
          </div>
          
          <div className="admin-user-info">
            <span className="admin-user-email">{user?.email}</span>
            <div className="admin-actions">
              <Button
                onClick={handleThemeToggle}
                variant="outline"
                size="small"
                className="theme-toggle-btn"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </Button>
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                size="small"
              >
                🏠 Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="small"
              >
                👋 Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-body">
        <div className="admin-content">
          <nav className="admin-sidebar">
            <div className="admin-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/admin'}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          <main className="admin-main">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}