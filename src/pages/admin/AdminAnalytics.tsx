/**
 * AdminAnalytics Page
 *
 * Project Analytics Dashboard
 * Shows: Stats Overview, Milestones Timeline
 *
 * Access: Admin/Super-Admin only
 */

import { useAnalytics } from '../../hooks/useAnalytics';
import { StatsGrid } from '../../components/admin/analytics/StatsGrid';
import { MilestonesList } from '../../components/admin/analytics/MilestonesList';
import { GrowthChart } from '../../components/admin/analytics/GrowthChart';
import { StorageBreakdown } from '../../components/admin/analytics/StorageBreakdown';
import './AdminAnalytics.scss';

export default function AdminAnalytics() {
  const { metrics, storage, loading, error, refresh } = useAnalytics();

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
        <button onClick={refresh} className="btn btn--secondary" title="Refresh Data">
          🔄 Refresh
        </button>
      </div>

      <div className="admin-analytics__content">
        <StatsGrid metrics={metrics} storage={storage} />
        <GrowthChart metrics={metrics} storage={storage} />
        <StorageBreakdown storage={storage} />
        <MilestonesList limit={12} />
      </div>
    </div>
  );
}
