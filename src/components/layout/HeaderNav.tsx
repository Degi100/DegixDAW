// ============================================
// HEADER NAVIGATION COMPONENT
// Corporate Theme - Navigation Links
// ============================================

import { Link, useLocation } from 'react-router-dom';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}

interface HeaderNavProps {
  navItems: NavigationItem[];
}

export default function HeaderNav({ navItems }: HeaderNavProps) {
  const location = useLocation();

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="header-nav">
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${isActivePath(item.path) ? 'active' : ''}`}
              aria-current={isActivePath(item.path) ? 'page' : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}