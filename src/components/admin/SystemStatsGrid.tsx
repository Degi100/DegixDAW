// src/components/admin/SystemStatsGrid.tsx
import type { SystemStats } from '../../hooks/useSystemStats';

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
      color: 'primary'
    },
    {
      icon: '💿',
      label: 'Storage Used',
      value: stats.storageUsed,
      trend: `${stats.storagePercentage.toFixed(1)}% of ${stats.storageTotal}`,
      color: stats.storagePercentage > 80 ? 'warning' : 'success'
    },
    {
      icon: '🔐',
      label: 'Failed Logins',
      value: stats.failedLogins.toString(),
      trend: 'Last 24 hours',
      color: stats.failedLogins > 10 ? 'danger' : 'success'
    },
    {
      icon: '📝',
      label: 'Total Projects',
      value: stats.totalProjects.toLocaleString(),
      trend: null,
      color: 'info'
    }
  ];

  return (
    <div className="system-stats-grid">
      {statCards.map((card, index) => (
        <div key={index} className={`stat-card ${card.color}`}>
          <div className="stat-card-icon">{card.icon}</div>
          <div className="stat-card-content">
            <div className="stat-card-label">{card.label}</div>
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
