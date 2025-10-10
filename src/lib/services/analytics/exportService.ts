/**
 * Export Service - CSV/JSON Export
 *
 * Exports Analytics Data in various formats:
 * - JSON: Full structured data
 * - CSV: Flattened table format
 *
 * Usage:
 * import { exportToJSON, exportToCSV } from './exportService';
 * exportToJSON(metrics, storage, milestones);
 */

import type { ProjectMetrics, StorageStats, Milestone } from './types';
import { PROJECT_CONFIG } from '../../constants/projectConfig';

/**
 * Generate filename with timestamp
 */
function generateFilename(format: 'json' | 'csv'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${PROJECT_CONFIG.name.toLowerCase()}-analytics-${date}.${format}`;
}

/**
 * Trigger browser download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Analytics Data as JSON
 */
export function exportToJSON(
  metrics: ProjectMetrics | null,
  storage: StorageStats | null,
  milestones: Milestone[]
): void {
  if (!metrics || !storage) {
    throw new Error('Cannot export: Analytics data not loaded');
  }

  const exportData = {
    meta: {
      project: PROJECT_CONFIG.name,
      github: PROJECT_CONFIG.github.url,
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    },
    metrics: {
      users: metrics.users,
      messages: metrics.messages,
      issues: metrics.issues,
      code: metrics.code
    },
    storage: {
      database: {
        total_mb: storage.database.total_mb,
        tables: storage.database.tables,
        largest_table: storage.database.largest_table,
        smallest_table: storage.database.smallest_table
      },
      storage: {
        total_mb: storage.storage.total_mb,
        buckets: storage.storage.buckets,
        largest_bucket: storage.storage.largest_bucket
      },
      quota: {
        quota_gb: storage.quota_gb,
        quota_used_percent: storage.quota_used_percent,
        total_mb: storage.total_mb
      }
    },
    milestones: milestones.map(m => ({
      date: m.date,
      title: m.title,
      category: m.category,
      icon: m.icon,
      description: m.description,
      commit_hash: m.commit_hash,
      commit_url: m.commit_hash
        ? `${PROJECT_CONFIG.github.url}/commit/${m.commit_hash}`
        : null
    }))
  };

  const json = JSON.stringify(exportData, null, 2);
  const filename = generateFilename('json');
  downloadFile(json, filename, 'application/json');

  console.log(`[ExportService] Exported JSON: ${filename}`);
}

/**
 * Export Analytics Data as CSV
 */
export function exportToCSV(
  metrics: ProjectMetrics | null,
  storage: StorageStats | null,
  milestones: Milestone[]
): void {
  if (!metrics || !storage) {
    throw new Error('Cannot export: Analytics data not loaded');
  }

  const rows: string[] = [];

  // Header
  rows.push(`"${PROJECT_CONFIG.name} - Analytics Export"`);
  rows.push(`"Exported: ${new Date().toISOString()}"`);
  rows.push('');

  // === SECTION 1: Project Metrics ===
  rows.push('"=== PROJECT METRICS ==="');
  rows.push('');

  // Users
  rows.push('"Category","Metric","Value"');
  rows.push(`"Users","Total",${metrics.users.total}`);
  rows.push(`"Users","Active (7d)",${metrics.users.active}`);
  rows.push(`"Users","Admins",${metrics.users.admins}`);
  rows.push(`"Users","Moderators",${metrics.users.moderators}`);
  rows.push(`"Users","Beta Users",${metrics.users.beta_users}`);
  rows.push(`"Users","Regular Users",${metrics.users.regular_users}`);
  rows.push('');

  // Messages
  rows.push(`"Messages","Total",${metrics.messages.total}`);
  rows.push(`"Messages","Today",${metrics.messages.today}`);
  rows.push(`"Messages","Conversations",${metrics.messages.conversations}`);
  rows.push('');

  // Issues
  rows.push(`"Issues","Total",${metrics.issues.total}`);
  rows.push(`"Issues","Open",${metrics.issues.open}`);
  rows.push(`"Issues","In Progress",${metrics.issues.in_progress}`);
  rows.push(`"Issues","Closed",${metrics.issues.closed}`);
  rows.push('');

  // Code
  rows.push(`"Code","Lines of Code",${metrics.code.loc}`);
  rows.push(`"Code","Files",${metrics.code.files}`);
  rows.push(`"Code","Commits",${metrics.code.commits}`);
  rows.push('');

  // === SECTION 2: Storage ===
  rows.push('"=== STORAGE ==="');
  rows.push('');

  // Database Tables
  rows.push('"Database Tables","Table Name","Size (MB)","Percentage"');
  storage.database.tables.forEach(table => {
    rows.push(`"","${table.name}",${table.size_mb.toFixed(2)},${table.percentage.toFixed(1)}%`);
  });
  rows.push(`"","TOTAL",${storage.database.total_mb.toFixed(2)},"100%"`);
  rows.push('');

  // Storage Buckets
  rows.push('"Storage Buckets","Bucket Name","Size (MB)","Files","Percentage"');
  storage.storage.buckets.forEach(bucket => {
    rows.push(
      `"","${bucket.name}",${bucket.size_mb.toFixed(2)},${bucket.files_count},${bucket.percentage.toFixed(1)}%`
    );
  });
  rows.push(`"","TOTAL",${storage.storage.total_mb.toFixed(2)},,"100%"`);
  rows.push('');

  // Quota
  rows.push('"Storage Quota","Metric","Value"');
  rows.push(`"","Total Storage (MB)",${storage.total_mb.toFixed(2)}`);
  rows.push(`"","Quota Limit (GB)",${storage.quota_gb}`);
  rows.push(`"","Quota Used (%)",${storage.quota_used_percent.toFixed(1)}%`);
  rows.push(
    `"","Available (MB)",${((storage.quota_gb * 1024) - storage.total_mb).toFixed(2)}`
  );
  rows.push('');

  // === SECTION 3: Milestones ===
  rows.push('"=== MILESTONES ==="');
  rows.push('');
  rows.push('"Date","Title","Category","Icon","Description","Commit Hash"');
  milestones.forEach(m => {
    const description = (m.description || '').replace(/"/g, '""'); // Escape quotes
    rows.push(
      `"${m.date}","${m.title}","${m.category}","${m.icon}","${description}","${m.commit_hash || ''}"`
    );
  });

  const csv = rows.join('\n');
  const filename = generateFilename('csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');

  console.log(`[ExportService] Exported CSV: ${filename}`);
}

/**
 * Export Data (Auto-detect format)
 */
export function exportAnalytics(
  format: 'json' | 'csv',
  metrics: ProjectMetrics | null,
  storage: StorageStats | null,
  milestones: Milestone[]
): void {
  try {
    if (format === 'json') {
      exportToJSON(metrics, storage, milestones);
    } else {
      exportToCSV(metrics, storage, milestones);
    }
  } catch (error) {
    console.error('[ExportService] Export failed:', error);
    throw error;
  }
}
