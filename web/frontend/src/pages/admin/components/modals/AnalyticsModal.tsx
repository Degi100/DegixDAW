// src/pages/admin/components/modals/AnalyticsModal.tsx
// User Analytics Dashboard Modal

import Button from '../../../../components/ui/Button';
import type { AnalyticsModalProps } from '../../types/admin.types';

export default function AnalyticsModal({
  isOpen,
  onClose,
  stats,
  users,
  onOpenExport
}: AnalyticsModalProps) {
  if (!isOpen) return null;

  const moderatorCount = users.filter(u => u.role === 'moderator').length;
  const regularUserCount = users.filter(u => !u.role || u.role === 'user').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 User Analytics</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="analytics-grid">
            {/* Growth Metrics Card */}
            <div className="analytics-card">
              <h4>Growth Metrics</h4>
              <div className="metric">
                <span className="metric-label">Recent Signups (7d)</span>
                <span className="metric-value">{stats.recentSignups}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Active (24h)</span>
                <span className="metric-value">{stats.last24h}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Active (7d)</span>
                <span className="metric-value">{stats.last7d}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Active (30d)</span>
                <span className="metric-value">{stats.last30d}</span>
              </div>
            </div>

            {/* User Distribution Card */}
            <div className="analytics-card">
              <h4>User Distribution</h4>
              <div className="metric">
                <span className="metric-label">Total Users</span>
                <span className="metric-value">{stats.total}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Active Users</span>
                <span className="metric-value">{stats.active}</span>
                <span className="metric-percent">
                  ({((stats.active / stats.total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Inactive Users</span>
                <span className="metric-value">{stats.inactive}</span>
                <span className="metric-percent">
                  ({((stats.inactive / stats.total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Pending Users</span>
                <span className="metric-value">{stats.pending}</span>
                <span className="metric-percent">
                  ({((stats.pending / stats.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Role Distribution Card */}
            <div className="analytics-card">
              <h4>Role Distribution</h4>
              <div className="metric">
                <span className="metric-label">Administrators</span>
                <span className="metric-value">{stats.admins}</span>
                <span className="metric-percent">
                  ({((stats.admins / stats.total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Moderators</span>
                <span className="metric-value">{moderatorCount}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Regular Users</span>
                <span className="metric-value">{regularUserCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <Button variant="outline" onClick={onOpenExport}>
            📥 Export Data
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
