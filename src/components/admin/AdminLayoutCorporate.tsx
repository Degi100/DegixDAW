// src/components/admin/AdminLayoutCorporate.tsx
// Ultimate Corporate Professional Admin Layout
import { type ReactNode, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import Header from '../layout/Header';

interface AdminNavItem {
  path: string;
  icon: string;
  label: string;
  routeId: string;      // Route-ID für Permission-Check
  hasChildren?: boolean;
  parent?: string;
}

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems: AdminNavItem[] = [
  { path: "/admin", icon: "📊", label: "Übersicht", routeId: "dashboard" },
  { path: "/admin/users", icon: "👥", label: "Users", routeId: "users" },
  { path: "/admin/issues", icon: "🐛", label: "Issues", routeId: "issues" },
  { path: "/admin/features", icon: "🚩", label: "Feature Flags", routeId: "features" },
  { path: "/admin/settings", icon: "⚙️", label: "Settings", routeId: "settings", hasChildren: true }
];

const subNavItems: AdminNavItem[] = [
  { path: "/admin/settings/versions", icon: "📦", label: "Versions", routeId: "versions", parent: "/admin/settings" }
];

export default function AdminLayoutCorporate({ children }: AdminLayoutProps) {
  const { adminLevel, isModerator, isRegularAdmin, isSuperAdmin } = useAdmin();

  // Filter nav items: Moderatoren sehen NUR Issues + Settings
  const filteredNavItems = useMemo(() => {
    // Moderator (kein Regular-Admin/Super-Admin) → nur Issues + Settings
    if (isModerator && !isRegularAdmin && !isSuperAdmin) {
      return navItems.filter(item => item.routeId === 'issues' || item.routeId === 'settings');
    }
    // Admin/Super-Admin → alles
    return navItems;
  }, [isModerator, isRegularAdmin, isSuperAdmin]);

  const filteredSubNavItems = useMemo(() => {
    // Moderatoren sehen nur Versions in Sub-Navigation
    if (isModerator && !isRegularAdmin && !isSuperAdmin) {
      return subNavItems.filter(item => item.routeId === 'versions');
    }
    return subNavItems;
  }, [isModerator, isRegularAdmin, isSuperAdmin]);

  return (
    <div className="admin-layout">
      <Header 
        customBrand={{ icon: '🎛️', name: 'Admin Panel' }}
        showAdminBadge={true}
        adminLevel={adminLevel}
      />

      <div className="admin-body">
        <div className="admin-content">
          <nav className="admin-sidebar">
            <div className="admin-nav">
              <div className="admin-nav-section">
                <h3 className="admin-nav-section-title">Management</h3>
                {filteredNavItems.map((item) => (
                    <div key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `admin-nav-link ${isActive ? 'active' : ''}`
                        }
                        end={item.path === '/admin'}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>

                      {/* Sub-Navigation für Settings */}
                      {item.hasChildren && (
                        <div className="admin-subnav">
                          {filteredSubNavItems
                            .filter(subItem => subItem.parent === item.path)
                            .map((subItem) => (
                              <NavLink
                                key={subItem.path}
                                to={subItem.path}
                                className={({ isActive }) =>
                                  `admin-nav-sublink ${isActive ? 'active' : ''}`
                                }
                              >
                                <span>{subItem.icon}</span>
                                <span>{subItem.label}</span>
                              </NavLink>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
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