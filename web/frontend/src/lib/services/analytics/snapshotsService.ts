/**
 * Snapshots Service - Historical Analytics Data
 *
 * Creates and loads project snapshots for historical timeline
 *
 * Usage:
 * import { createSnapshot, getSnapshots } from './snapshotsService';
 */

import { supabase } from '../../supabase';
import { getProjectMetrics } from './metricsService';
import { getStorageStats } from './storageService';
import { getCodeMetrics } from './codeMetricsService.browser';

export interface ProjectSnapshot {
  id: string;
  snapshot_date: string; // YYYY-MM-DD

  // Code Metrics
  total_loc: number;
  total_files: number;
  total_commits: number;

  // Language Breakdown (LOC per language)
  typescript_loc?: number;
  javascript_loc?: number;
  scss_loc?: number;
  css_loc?: number;
  sql_loc?: number;
  json_loc?: number;
  markdown_loc?: number;

  // User Metrics
  total_users: number;
  active_users: number;

  // Chat Metrics
  total_messages: number;
  total_conversations: number;

  // Issue Metrics
  total_issues: number;
  open_issues: number;
  closed_issues: number;
  in_progress_issues: number;

  // Storage Metrics
  database_size_mb: number;
  storage_size_mb: number;
  total_storage_mb: number;

  // Metadata
  created_at: string;
  created_by: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Create a snapshot for today (or specific date)
 */
export async function createSnapshot(date?: string): Promise<ProjectSnapshot> {
  const snapshotDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`[SnapshotsService] Creating snapshot for ${snapshotDate}...`);

  // Fetch current metrics
  const [metrics, storage, code] = await Promise.all([
    getProjectMetrics(),
    getStorageStats(),
    getCodeMetrics()
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  const snapshot = {
    snapshot_date: snapshotDate,

    // Code
    total_loc: code.loc,
    total_files: code.files,
    total_commits: code.commits,

    // Language Breakdown (if available from API)
    typescript_loc: (code as any).languageStats?.typescript || 0,
    javascript_loc: (code as any).languageStats?.javascript || 0,
    scss_loc: (code as any).languageStats?.scss || 0,
    css_loc: (code as any).languageStats?.css || 0,
    sql_loc: (code as any).languageStats?.sql || 0,
    json_loc: (code as any).languageStats?.json || 0,
    markdown_loc: (code as any).languageStats?.markdown || 0,

    // Users
    total_users: metrics.users.total,
    active_users: metrics.users.active,

    // Messages
    total_messages: metrics.messages.total,
    total_conversations: metrics.messages.conversations,

    // Issues
    total_issues: metrics.issues.total,
    open_issues: metrics.issues.open,
    closed_issues: metrics.issues.closed,
    in_progress_issues: metrics.issues.in_progress,

    // Storage
    database_size_mb: storage.database.total_mb,
    storage_size_mb: storage.storage.total_mb,
    total_storage_mb: storage.total_mb,

    // Metadata
    created_by: user?.id || null,
    metadata: {
      created_via: 'manual_button',
      project_age_days: code.projectAge.days
    }
  };

  // Insert or update (upsert on snapshot_date)
  const { data, error } = await supabase
    .from('project_snapshots')
    .upsert(snapshot, { onConflict: 'snapshot_date' })
    .select()
    .single();

  if (error) {
    console.error('[SnapshotsService] Failed to create snapshot:', error);
    throw error;
  }

  console.log('[SnapshotsService] Snapshot created successfully:', data.id);
  return data;
}

/**
 * Get all snapshots (ordered by date DESC)
 */
export async function getSnapshots(limit?: number): Promise<ProjectSnapshot[]> {
  let query = supabase
    .from('project_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[SnapshotsService] Failed to fetch snapshots:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get snapshots for date range
 */
export async function getSnapshotsRange(
  startDate: string,
  endDate: string
): Promise<ProjectSnapshot[]> {
  const { data, error } = await supabase
    .from('project_snapshots')
    .select('*')
    .gte('snapshot_date', startDate)
    .lte('snapshot_date', endDate)
    .order('snapshot_date', { ascending: true });

  if (error) {
    console.error('[SnapshotsService] Failed to fetch snapshots range:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete old snapshots (keep last N days)
 */
export async function cleanupOldSnapshots(keepDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('project_snapshots')
    .delete()
    .lt('snapshot_date', cutoffDateStr)
    .select();

  if (error) {
    console.error('[SnapshotsService] Failed to cleanup snapshots:', error);
    throw error;
  }

  console.log(`[SnapshotsService] Deleted ${data?.length || 0} old snapshots`);
  return data?.length || 0;
}
