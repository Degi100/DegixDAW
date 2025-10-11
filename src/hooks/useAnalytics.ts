/**
 * useAnalytics Hook
 *
 * Main hook for Analytics Dashboard
 * Fetches and manages all analytics data:
 * - Project Metrics (Users, Messages, Issues, Code)
 * - Storage Stats (Database, Buckets)
 *
 * Usage:
 * const { metrics, storage, loading, error, refresh } = useAnalytics();
 */

import { useState, useEffect } from 'react';
import { getProjectMetrics } from '../lib/services/analytics/metricsService';
import { getStorageStats } from '../lib/services/analytics/storageService';
import type { AnalyticsData } from '../lib/services/analytics/types';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    metrics: null,
    storage: null,
    loading: true,
    error: null
  });

  const loadAnalytics = async () => {
    try {
      console.log('[useAnalytics] Loading analytics data...');
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch metrics and storage in parallel
      const [metrics, storage] = await Promise.all([
        getProjectMetrics(),
        getStorageStats()
      ]);

      setData({
        metrics,
        storage,
        loading: false,
        error: null
      });

      console.log('[useAnalytics] Analytics data loaded successfully');
    } catch (error) {
      console.error('[useAnalytics] Failed to load analytics:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics data'
      }));
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    ...data,
    refresh: loadAnalytics
  };
}
