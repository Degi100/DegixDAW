// src/components/admin/AdminLayout.tsx
// Layout component for admin pages with navigation

import { type ReactNode } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Container from '../layout/Container';
import { APP_CONFIG } from '../../lib/constants';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { adminLevel } = useAdmin();

  const handleLogout = async () => {
  await signOut();
  navigate('/dashboard');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <Container>
          <div className="admin-header-content">
            <div className="admin-branding">
              <div className="admin-branding-main">
                <h1>🛡️ {APP_CONFIG.name} Admin</h1>
                <span className="admin-badge">{adminLevel.replace('_', ' ').toUpperCase()}</span>
              </div>
              <span className="app-version">v{APP_CONFIG.version}</span>
            </div>
            
            <div className="admin-user-info">
              <span className="admin-user-email">{user?.email}</span>
              <div className="admin-actions">
                <Button 
                  onClick={handleBackToDashboard}
                  variant="outline"
                  size="small"
                >
                  📊 Dashboard
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
        </Container>
      </header>

      <div className="admin-body">
        <Container>
          <div className="admin-content">
            {/* Admin Sidebar Navigation */}
            <aside className="admin-sidebar">
              <nav className="admin-nav">
                <NavLink 
                  to="/admin" 
                  end
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                >
                  📈 Overview
                </NavLink>
                <NavLink 
                  to="/admin/users" 
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                >
                  👥 Users
                </NavLink>
                <NavLink 
                  to="/admin/system" 
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                >
                  ⚙️ System
                </NavLink>
              </nav>
            </aside>

            {/* Admin Main Content */}
            <main className="admin-main">
              {children}
            </main>
          </div>
        </Container>
      </div>
    </div>
  );
}