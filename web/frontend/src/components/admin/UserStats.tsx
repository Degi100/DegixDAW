// src/components/admin/UserStats.tsx
import type { UserStats } from '../../hooks/useUserStats';

interface UserStatsProps {
  stats: UserStats;
}

export default function UserStats({ stats }: UserStatsProps) {
  return (
    <div className="users-stats corporate-stats">
      <div className="stats-card">
        <div className="stats-icon">👥</div>
        <div className="stats-content">
          <div className="stats-number">{stats.total}</div>
          <div className="stats-label">Total Users</div>
        </div>
      </div>
      <div className="stats-card">
        <div className="stats-icon">✅</div>
        <div className="stats-content">
          <div className="stats-number">{stats.active}</div>
          <div className="stats-label">Active</div>
        </div>
      </div>
      <div className="stats-card">
        <div className="stats-icon">⏸️</div>
        <div className="stats-content">
          <div className="stats-number">{stats.inactive}</div>
          <div className="stats-label">Inactive</div>
        </div>
      </div>
      <div className="stats-card">
        <div className="stats-icon">⏳</div>
        <div className="stats-content">
          <div className="stats-number">{stats.pending}</div>
          <div className="stats-label">Pending</div>
        </div>
      </div>
      <div className="stats-card">
        <div className="stats-icon">👑</div>
        <div className="stats-content">
          <div className="stats-number">{stats.admins}</div>
          <div className="stats-label">Admins</div>
        </div>
      </div>
      <div className="stats-card highlight">
        <div className="stats-icon">📈</div>
        <div className="stats-content">
          <div className="stats-number">{stats.last24h}</div>
          <div className="stats-label">Active (24h)</div>
        </div>
      </div>
    </div>
  );
}