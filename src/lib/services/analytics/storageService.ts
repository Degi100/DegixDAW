/**
 * Storage Service - Supabase Database & Storage Size Analytics
 *
 * Provides storage metrics from:
 * - PostgreSQL Database (via RPC functions)
 * - Supabase Storage Buckets (via Storage API)
 *
 * Note: Bucket stats include fallback for non-existent buckets
 * to prepare for future storage features (avatars, project-files).
 */

import { supabase } from '../../supabase';
import { PROJECT_CONFIG } from '../../constants/projectConfig';
import type { StorageStats, TableSize, BucketSize } from './types';

/**
 * Get total database size in MB
 * Requires: SQL function `get_database_size()` deployed
 */
export async function getDatabaseSize(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_database_size');

    if (error) {
      console.error('[StorageService] Failed to get database size:', error);
      throw error;
    }

    // Convert bytes to MB
    return (data as number) / (1024 * 1024);
  } catch (error) {
    console.error('[StorageService] getDatabaseSize error:', error);
    return 0;
  }
}

/**
 * Get size of all tables in public schema
 * Requires: SQL function `get_table_sizes()` deployed
 */
export async function getTableSizes(): Promise<TableSize[]> {
  try {
    const { data, error } = await supabase.rpc('get_table_sizes');

    if (error) {
      console.error('[StorageService] Failed to get table sizes:', error);
      throw error;
    }

    if (!data || !Array.isArray(data)) return [];

    // Convert to typed array with MB + percentage placeholder
    return data.map((table: any) => ({
      name: table.tablename,
      size_mb: table.size_bytes / (1024 * 1024),
      percentage: 0 // Calculated later in getStorageStats()
    }));
  } catch (error) {
    console.error('[StorageService] getTableSizes error:', error);
    return [];
  }
}

/**
 * Get size and file count for a specific storage bucket
 * Returns zero values if bucket doesn't exist (for future-proofing)
 */
export async function getBucketSize(bucketName: string): Promise<BucketSize> {
  try {
    const { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      // Bucket doesn't exist or not accessible - return zeros
      console.warn(`[StorageService] Bucket "${bucketName}" not accessible:`, error.message);
      return {
        name: bucketName,
        size_mb: 0,
        files_count: 0,
        percentage: 0
      };
    }

    if (!files || files.length === 0) {
      return {
        name: bucketName,
        size_mb: 0,
        files_count: 0,
        percentage: 0
      };
    }

    // Calculate total size from file metadata
    const totalBytes = files.reduce((sum, file) => {
      const fileSize = file.metadata?.size || 0;
      return sum + fileSize;
    }, 0);

    return {
      name: bucketName,
      size_mb: totalBytes / (1024 * 1024),
      files_count: files.length,
      percentage: 0 // Calculated later
    };
  } catch (error) {
    console.error(`[StorageService] getBucketSize(${bucketName}) error:`, error);
    return {
      name: bucketName,
      size_mb: 0,
      files_count: 0,
      percentage: 0
    };
  }
}

/**
 * Get complete storage statistics
 * Includes database, storage buckets, and total size
 *
 * Known buckets:
 * - chat-attachments (exists)
 * - avatars (planned)
 * - project-files (planned)
 */
export async function getStorageStats(): Promise<StorageStats> {
  try {
    console.log('[StorageService] Fetching storage stats...');

    // Fetch database and bucket stats in parallel
    const [dbSize, tables] = await Promise.all([
      getDatabaseSize(),
      getTableSizes()
    ]);

    // Define buckets (existing + planned)
    const bucketNames = ['chat-attachments', 'avatars', 'project-files'];
    const buckets = await Promise.all(
      bucketNames.map(name => getBucketSize(name))
    );

    // Calculate storage total
    const storageTotal = buckets.reduce((sum, b) => sum + b.size_mb, 0);

    // Calculate percentages
    tables.forEach(table => {
      table.percentage = dbSize > 0 ? (table.size_mb / dbSize) * 100 : 0;
    });

    buckets.forEach(bucket => {
      bucket.percentage = storageTotal > 0 ? (bucket.size_mb / storageTotal) * 100 : 0;
    });

    // Find extremes
    const sortedTables = [...tables].sort((a, b) => b.size_mb - a.size_mb);
    const largest_table = sortedTables[0];
    const smallest_table = sortedTables[sortedTables.length - 1];

    const sortedBuckets = [...buckets].sort((a, b) => b.size_mb - a.size_mb);
    const largest_bucket = sortedBuckets[0];

    // Calculate quota
    const totalMB = dbSize + storageTotal;
    const quota_gb = PROJECT_CONFIG.storage.quotaGB;
    const quota_used_percent = (totalMB / (quota_gb * 1024)) * 100;

    const stats: StorageStats = {
      database: {
        total_mb: dbSize,
        tables: tables.slice(0, 10), // Top 10 largest tables
        largest_table,
        smallest_table
      },
      storage: {
        total_mb: storageTotal,
        buckets,
        largest_bucket
      },
      total_mb: totalMB,
      quota_gb,
      quota_used_percent
    };

    console.log('[StorageService] Stats fetched successfully:', {
      db_mb: dbSize.toFixed(2),
      storage_mb: storageTotal.toFixed(2),
      total_mb: stats.total_mb.toFixed(2)
    });

    return stats;
  } catch (error) {
    console.error('[StorageService] getStorageStats error:', error);
    throw new Error('Failed to fetch storage statistics');
  }
}
