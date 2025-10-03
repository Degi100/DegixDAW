// src/components/admin/SystemStatsGrid.tsx
import type { SystemStats } from '../../hooks/useSystemStats';
import { MockDataBadge } from './MockDataBadge';

interface SystemStatsGridProps {
  stats: SystemStats;
  loading: boolean;
}

export default function SystemStatsGrid({ stats, loading }: SystemStatsGridProps) {
  if (loading) {
    return (
      <div className="system-stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card loading">
            <div className="loading-spinner" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      icon: '👥',
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      trend: null,
      color: 'primary',
      isMock: false
    },
    {
      icon: '💿',
      label: 'Storage Used',
      value: stats.storageUsed,
      trend: `${stats.storagePercentage.toFixed(1)}% of ${stats.storageTotal}`,
      color: stats.storagePercentage > 80 ? 'warning' : 'success',
      isMock: true,
      mockTooltip: 'Storage-Daten sind noch nicht mit echtem Backend verbunden'
    },
    {
      icon: '🔐',
      label: 'Failed Logins',
      value: stats.failedLogins.toString(),
      trend: 'Last 24 hours',
      color: stats.failedLogins > 10 ? 'danger' : 'success',
      isMock: true,
      mockTooltip: 'Failed-Login-Tracking ist noch nicht implementiert'
    },
    {
      icon: '📝',
      label: 'Total Projects',
      value: stats.totalProjects.toLocaleString(),
      trend: null,
      color: 'info',
      isMock: true,
      mockTooltip: 'Projects-Tabelle existiert noch nicht in der Datenbank'
    }
  ];

  return (
    <div className="system-stats-grid">
      {statCards.map((card, index) => (
        <div key={index} className={`stat-card ${card.color}`}>
          <div className="stat-card-icon">{card.icon}</div>
          <div className="stat-card-content">
            <div className="stat-card-label">
              {card.label}
              {card.isMock && (
                <MockDataBadge 
                  message="Fake"
                  tooltip={card.mockTooltip || 'Diese Daten sind noch nicht mit Backend verbunden'}
                />
              )}
            </div>
            <div className="stat-card-value">{card.value}</div>
            {card.trend && (
              <div className="stat-card-trend">{card.trend}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
