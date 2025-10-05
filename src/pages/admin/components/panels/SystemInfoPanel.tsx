// src/pages/admin/components/panels/SystemInfoPanel.tsx
// System Information Display Panel

import { NavLink } from 'react-router-dom';
import Button from '../../../../components/ui/Button';
import type { SystemInfoPanelProps } from '../../types/admin.types';

export default function SystemInfoPanel({
  systemInfo,
  onRefresh,
  onTestEmail
}: SystemInfoPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return 'success';
      case 'disconnected':
      case 'offline':
        return 'danger';
      case 'degraded':
      case 'error':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">System Information</h2>
      <p className="section-description">Read-only system status and information</p>

      <div className="info-grid">
        <NavLink to="/admin/settings/versions" className="info-card info-card--clickable">
          <div className="info-icon">📦</div>
          <div className="info-content">
            <div className="info-label">Application Version</div>
            <div className="info-value">{systemInfo.appVersion}</div>
          </div>
        </NavLink>

        <div className="info-card">
          <div className="info-icon">🗄️</div>
          <div className="info-content">
            <div className="info-label">Database Status</div>
            <div className="info-value">
              <span className={`status-badge ${getStatusColor(systemInfo.dbStatus)}`}>
                {systemInfo.dbStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🌐</div>
          <div className="info-content">
            <div className="info-label">API Status</div>
            <div className="info-value">
              <span className={`status-badge ${getStatusColor(systemInfo.apiStatus)}`}>
                {systemInfo.apiStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">💾</div>
          <div className="info-content">
            <div className="info-label">Last Backup</div>
            <div className="info-value">
              {new Date(systemInfo.lastBackup).toLocaleString('de-DE')}
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">👥</div>
          <div className="info-content">
            <div className="info-label">Total Users</div>
            <div className="info-value">{systemInfo.totalUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">📊</div>
          <div className="info-content">
            <div className="info-label">Total Storage</div>
            <div className="info-value">{systemInfo.totalStorage}</div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Button variant="outline" onClick={onRefresh}>
          🔄 Refresh Status
        </Button>
        <Button variant="outline" onClick={onTestEmail}>
          📧 Send Test Email
        </Button>
      </div>
    </div>
  );
}
