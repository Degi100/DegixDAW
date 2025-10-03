// src/pages/admin/AdminDashboardCorporate.tsx
// Modern Corporate Admin Dashboard with Theme Support

import { useNavigate } from 'react-router-dom';
import AdminLayoutCorporate from '../../components/admin/AdminLayoutCorporate';
import { useTheme } from '../../hooks/useTheme';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { useSystemStats } from '../../hooks/useSystemStats';
import SystemHealthCard from '../../components/admin/SystemHealthCard';
import SystemStatsGrid from '../../components/admin/SystemStatsGrid';
import RecentActivityFeed from '../../components/admin/RecentActivityFeed';

export default function AdminDashboardCorporate() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { health, loading: healthLoading, refresh: refreshHealth } = useSystemHealth();
  const { stats, loading: statsLoading } = useSystemStats();

  const quickActions = [
    { icon: '���', title: 'Users', description: 'Manage users', action: () => navigate('/admin/users') },
    { icon: '⚙️', title: 'Settings', description: 'System settings', action: () => navigate('/admin/settings') },
    { icon: '���', title: 'Reports', description: 'Generate reports', action: () => navigate('/admin/reports') }
  ];

  return (
    <AdminLayoutCorporate>
      <div className={`admin-dashboard-corporate ${theme}`}>
        <header className="admin-page-header">
          <h1>Übersicht</h1>
          <p>Willkommen zurück! Überwache deine System-Performance und verwalte Operationen von dieser zentralen Übersicht aus.</p>
        </header>

        <div className="dashboard-section">
          <SystemHealthCard 
            health={health} 
            loading={healthLoading} 
            onRefresh={refreshHealth} 
          />
        </div>

        <div className="dashboard-section">
          <SystemStatsGrid 
            stats={stats} 
            loading={statsLoading} 
          />
        </div>

        <div className="admin-actions-section">
          <header className="section-header">
            <h2>Quick Actions</h2>
            <p>Frequently used administrative tasks and management tools</p>
          </header>
          
          <div className="admin-actions-grid">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="admin-action-card"
                onClick={action.action}
              >
                <div className="action-card-icon">{action.icon}</div>
                <h3 className="action-card-title">{action.title}</h3>
                <p className="action-card-description">{action.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <RecentActivityFeed />
        </div>
      </div>
    </AdminLayoutCorporate>
  );
}
