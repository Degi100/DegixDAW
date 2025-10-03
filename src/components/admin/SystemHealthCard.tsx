// src/components/admin/SystemHealthCard.tsx
import type { SystemHealth } from '../../hooks/useSystemHealth';
import { MockDataBadge } from './MockDataBadge';

interface SystemHealthCardProps {
  health: SystemHealth;
  loading: boolean;
  onRefresh: () => void;
}

export default function SystemHealthCard({ health, loading, onRefresh }: SystemHealthCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'offline':
      case 'disconnected':
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'offline':
      case 'disconnected':
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatLastBackup = (timestamp: string | null) => {
    if (!timestamp) return 'No backup';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Less than 1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="system-health-card loading">
        <div className="health-card-header">
          <h3>🏥 System Health</h3>
        </div>
        <div className="health-card-body">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="system-health-card">
      <div className="health-card-header">
        <h3>🏥 System Health</h3>
        <button 
          className="refresh-button"
          onClick={onRefresh}
          title="Refresh health status"
        >
          🔄
        </button>
      </div>
      
      <div className="health-card-body">
        <div className="health-item">
          <div className="health-item-label">
            <span className="health-icon">{getStatusIcon(health.systemStatus)}</span>
            <span>System Status</span>
          </div>
          <span className={`status-badge ${getStatusColor(health.systemStatus)}`}>
            {health.systemStatus}
          </span>
        </div>

        <div className="health-item">
          <div className="health-item-label">
            <span className="health-icon">{getStatusIcon(health.databaseStatus)}</span>
            <span>Database</span>
          </div>
          <span className={`status-badge ${getStatusColor(health.databaseStatus)}`}>
            {health.databaseStatus}
          </span>
        </div>

        <div className="health-item">
          <div className="health-item-label">
            <span className="health-icon">💾</span>
            <span>Last Backup</span>
            <MockDataBadge 
              message="Fake"
              tooltip="Last Backup Zeitstempel ist noch nicht mit echtem Backend verbunden"
            />
          </div>
          <span className="health-value">
            {formatLastBackup(health.lastBackup)}
          </span>
        </div>

        <div className="health-item">
          <div className="health-item-label">
            <span className="health-icon">⏱️</span>
            <span>Uptime</span>
            <MockDataBadge 
              message="Fake"
              tooltip="Uptime wird aktuell zufällig berechnet, nicht vom Backend"
            />
          </div>
          <span className="health-value">
            {health.uptime}
          </span>
        </div>

        {/* Token Usage */}
        <div className="health-item token-usage">
          <div className="health-item-label">
            <span className="health-icon">🎫</span>
            <span>Token Usage</span>
            <MockDataBadge 
              message="Mock"
              tooltip="Token-Verbrauch ist simuliert. In Zukunft echte API-Integration."
            />
          </div>
          <div className="token-info">
            <span className="token-count">
              {health.tokensUsed.toLocaleString()} / {health.tokensMax.toLocaleString()}
            </span>
            <span className="token-percentage">
              {health.tokensPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="token-progress">
            <div 
              className={`token-progress-bar ${getTokenColorClass(health.tokensPercentage)}`}
              style={{ width: `${Math.min(health.tokensPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getTokenColorClass(percentage: number): string {
  if (percentage >= 90) return 'danger';
  if (percentage >= 75) return 'warning';
  if (percentage >= 50) return 'caution';
  return 'success';
}
