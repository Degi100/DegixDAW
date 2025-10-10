/**
 * StorageBreakdown Component
 *
 * Visual breakdown of Database Tables and Storage Buckets
 * Uses Recharts BarChart for visualization
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StorageStats } from '../../../lib/services/analytics/types';
import './StorageBreakdown.scss';

interface StorageBreakdownProps {
  storage: StorageStats;
}

export function StorageBreakdown({ storage }: StorageBreakdownProps) {
  const formatBytes = (mb: number): string => {
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Prepare data for Database Tables chart (top 5)
  const tablesData = storage.database.tables.slice(0, 5).map(table => ({
    name: table.name,
    size_mb: parseFloat(table.size_mb.toFixed(2)),
    percentage: parseFloat(table.percentage.toFixed(1))
  }));

  // Prepare data for Storage Buckets chart
  const bucketsData = storage.storage.buckets.map(bucket => ({
    name: bucket.name,
    size_mb: parseFloat(bucket.size_mb.toFixed(2)),
    files: bucket.files_count,
    percentage: parseFloat(bucket.percentage.toFixed(1))
  }));

  // Color palette
  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="storage-tooltip">
          <p className="storage-tooltip__name">{data.name}</p>
          <p className="storage-tooltip__size">
            Size: <strong>{formatBytes(data.size_mb)}</strong>
          </p>
          <p className="storage-tooltip__percentage">
            {data.percentage}% of total
          </p>
          {data.files !== undefined && (
            <p className="storage-tooltip__files">
              Files: {data.files}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="storage-breakdown">
      <div className="storage-breakdown__header">
        <h2>💾 Storage Breakdown</h2>
      </div>

      <div className="storage-breakdown__charts">
        {/* Database Tables Chart */}
        <div className="storage-breakdown__chart">
          <h3>Database Tables (Top 5)</h3>
          <p className="storage-breakdown__subtitle">
            Total: {formatBytes(storage.database.total_mb)} across {storage.database.tables.length} tables
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tablesData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="var(--text-secondary)"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: '0.75rem' }}
                label={{ value: 'Size (MB)', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-secondary)' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="size_mb" radius={[8, 8, 0, 0]}>
                {tablesData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Storage Buckets Chart */}
        <div className="storage-breakdown__chart">
          <h3>Storage Buckets</h3>
          <p className="storage-breakdown__subtitle">
            Total: {formatBytes(storage.storage.total_mb)} across {storage.storage.buckets.length} buckets
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bucketsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="var(--text-secondary)"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: '0.75rem' }}
                label={{ value: 'Size (MB)', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-secondary)' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="size_mb" radius={[8, 8, 0, 0]}>
                {bucketsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Storage Quota Progress Bar */}
      <div className="storage-breakdown__quota">
        <div className="quota-header">
          <h3>📦 Storage Quota</h3>
          <span className="quota-usage">
            {formatBytes(storage.total_mb)} / {storage.quota_gb} GB
            ({storage.quota_used_percent.toFixed(1)}%)
          </span>
        </div>
        <div className="quota-bar">
          <div
            className={`quota-bar__fill ${storage.quota_used_percent > 80 ? 'warning' : ''}`}
            style={{ width: `${Math.min(storage.quota_used_percent, 100)}%` }}
          />
        </div>
        {storage.quota_used_percent > 80 && (
          <p className="quota-warning">
            ⚠️ Warning: Storage quota is over 80% used!
          </p>
        )}
      </div>
    </div>
  );
}
