/**
 * AdminAnalytics Page
 *
 * Project Analytics Dashboard
 * Shows: Stats Overview, Milestones Timeline, Export
 *
 * Access: Admin/Super-Admin only
 */

import { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { StatsGrid } from '../../components/admin/analytics/StatsGrid';
import { MilestonesList } from '../../components/admin/analytics/MilestonesList';
import { GrowthChart } from '../../components/admin/analytics/GrowthChart';
import { StorageBreakdown } from '../../components/admin/analytics/StorageBreakdown';
import { ExportModal } from '../../components/admin/analytics/ExportModal';
import { AddMilestoneModal } from '../../components/admin/analytics/AddMilestoneModal';
import { AutoRefreshSettings } from '../../components/admin/analytics/AutoRefreshSettings';
import { milestones } from '../../lib/constants/milestones';
import './AdminAnalytics.scss';

export default function AdminAnalytics() {
  const { metrics, storage, loading, error, refresh } = useAnalytics();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [milestonesKey, setMilestonesKey] = useState(0);

  // Auto-Refresh Hook
  const autoRefresh = useAutoRefresh(refresh, {
    defaultInterval: 30000, // 30 seconds
    defaultEnabled: false
  });

  // Pause auto-refresh when modals are open
  useEffect(() => {
    if (showExportModal || showAddMilestoneModal) {
      autoRefresh.pause();
    } else {
      autoRefresh.resume();
    }
  }, [showExportModal, showAddMilestoneModal, autoRefresh]);

  if (loading) {
    return (
      <div className="admin-analytics">
        <div className="admin-analytics__header">
          <h1>📊 Project Analytics</h1>
        </div>
        <div className="admin-analytics__loading">
          <div className="spinner" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-analytics">
        <div className="admin-analytics__header">
          <h1>📊 Project Analytics</h1>
        </div>
        <div className="admin-analytics__error">
          <p>❌ {error}</p>
          <button onClick={refresh} className="btn btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics || !storage) {
    return (
      <div className="admin-analytics">
        <div className="admin-analytics__header">
          <h1>📊 Project Analytics</h1>
        </div>
        <div className="admin-analytics__error">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="admin-analytics__header">
        <div>
          <h1>📊 Project Analytics</h1>
          <p className="admin-analytics__subtitle">
            Real-time project statistics and growth metrics
          </p>
        </div>
        <div className="admin-analytics__actions">
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn--secondary"
            title="Export Data"
          >
            📤 Export
          </button>
          <button onClick={refresh} className="btn btn--secondary" title="Refresh Data">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Auto-Refresh Settings */}
      <div className="admin-analytics__settings">
        <AutoRefreshSettings autoRefresh={autoRefresh} />
      </div>

      <div className="admin-analytics__content">
        <StatsGrid metrics={metrics} storage={storage} />
        <GrowthChart metrics={metrics} storage={storage} />
        <StorageBreakdown storage={storage} />
        <MilestonesList
          key={milestonesKey}
          limit={12}
          onAddClick={() => setShowAddMilestoneModal(true)}
        />
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          metrics={metrics}
          storage={storage}
          milestones={milestones}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <AddMilestoneModal
          onClose={() => setShowAddMilestoneModal(false)}
          onSuccess={() => {
            // Trigger reload in MilestonesList by changing key
            setMilestonesKey(prev => prev + 1);
            setShowAddMilestoneModal(false);
          }}
        />
      )}
    </div>
  );
}
