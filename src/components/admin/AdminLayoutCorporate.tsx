// src/components/admin/AdminLayoutCorporate.tsx
// Ultimate Corporate Professional Admin Layout

import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import Header from '../layout/Header';

interface AdminLayoutProps {
  children: ReactNode;
}



const navItems = [
  { path: "/admin", icon: "📊", label: "Übersicht" },
  { path: "/admin/users", icon: "👥", label: "Users" },
  { path: "/admin/settings", icon: "⚙️", label: "Settings" }
];

const navSections = [
  {
    title: "Management",
    items: navItems
  }
];

export default function AdminLayoutCorporate({ children }: AdminLayoutProps) {
  const { adminLevel } = useAdmin();

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
              {navSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="admin-nav-section">
                  <h3 className="admin-nav-section-title">{section.title}</h3>
                  {section.items.map((item) => (
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