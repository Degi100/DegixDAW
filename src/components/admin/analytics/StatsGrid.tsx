/**
 * StatsGrid Component
 *
 * 7-Card Grid Layout for Key Metrics:
 * - Users, Messages, Issues, LOC
 * - Database Size, Storage Size, Total Size
 */

import { StatsCard } from './StatsCard';
import type { ProjectMetrics, StorageStats } from '../../../lib/services/analytics/types';
import '../../../styles/components/analytics/StatsGrid.scss';

interface StatsGridProps {
  metrics: ProjectMetrics;
  storage: StorageStats;
}

export function StatsGrid({ metrics, storage }: StatsGridProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatBytes = (mb: number): string => {
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="stats-grid">
      <div className="stats-grid__header">
        <h2>📊 Project Overview</h2>
        <span className="stats-grid__subtitle">
          Since {metrics.code.projectAge.startDate}
        </span>
      </div>

      <div className="stats-grid__cards">
        {/* Row 1: Core Metrics */}
        <StatsCard
          icon="👥"
          label="Users"
          value={metrics.users.total}
          subtitle={`${metrics.users.active} active (7d)`}
          details={[
            `${metrics.users.admins} Admins`,
            `${metrics.users.moderators} Moderators`,
            `${metrics.users.beta_users} Beta Users`,
            `${metrics.users.regular_users} Regular Users`
          ]}
        />

        <StatsCard
          icon="💬"
          label="Messages"
          value={formatNumber(metrics.messages.total)}
          subtitle={`${metrics.messages.today} today`}
        />

        <StatsCard
          icon="🐛"
          label="Issues"
          value={metrics.issues.total}
          subtitle={`${metrics.issues.open} open`}
        />

        <StatsCard
          icon="📝"
          label="Lines of Code"
          value={formatNumber(metrics.code.loc)}
          subtitle={`${metrics.code.files} files`}
        />

        {/* Row 2: Storage Metrics */}
        <StatsCard
          icon="💾"
          label="Database"
          value={formatBytes(storage.database.total_mb)}
          subtitle={`${storage.database.tables.length} tables`}
          {...(storage.database.largest_table && storage.database.smallest_table
            ? {
                details: [
                  `Largest: ${storage.database.largest_table.name} (${formatBytes(storage.database.largest_table.size_mb)})`,
                  `Smallest: ${storage.database.smallest_table.name} (${formatBytes(storage.database.smallest_table.size_mb)})`
                ]
              }
            : {})}
        />

        <StatsCard
          icon="📦"
          label="Storage"
          value={formatBytes(storage.storage.total_mb)}
          subtitle={`${storage.storage.buckets.reduce((sum, b) => sum + b.files_count, 0)} files`}
          {...(storage.storage.largest_bucket
            ? {
                details: [`Largest: ${storage.storage.largest_bucket.name} (${formatBytes(storage.storage.largest_bucket.size_mb)})`]
              }
            : {})}
        />

        <StatsCard
          icon="📡"
          label="Total Size"
          value={formatBytes(storage.total_mb)}
          subtitle={`Quota: ${storage.quota_gb} GB`}
          details={[
            `Used: ${storage.quota_used_percent.toFixed(1)}%`,
            `Available: ${formatBytes((storage.quota_gb * 1024) - storage.total_mb)}`
          ]}
        />
      </div>
    </div>
  );
}
