// ============================================
// USE FEATURE FLAGS HOOK
// React hook for Feature Flags with Realtime sync
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  getAllFeaturesAsync,
  refreshFeatureFlags,
  type FeatureFlag,
} from '../lib/constants/featureFlags';
import { subscribeToFeatureFlags } from '../lib/services/featureFlags';

interface UseFeatureFlagsReturn {
  features: FeatureFlag[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for accessing feature flags with Realtime updates
 *
 * Features:
 * - Auto-loads flags from Supabase on mount
 * - Subscribes to Realtime updates
 * - Provides refresh function for manual reload
 * - Handles loading and error states
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { features, loading, refresh } = useFeatureFlags();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {features.map(f => (
 *         <div key={f.id}>{f.name}: {f.enabled ? 'ON' : 'OFF'}</div>
 *       ))}
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load features from Supabase
  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedFeatures = await getAllFeaturesAsync();
      setFeatures(loadedFeatures);

      console.log('[useFeatureFlags] Loaded features:', loadedFeatures.length);
    } catch (err) {
      console.error('[useFeatureFlags] Error loading features:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh function for manual reload
  const refresh = useCallback(async () => {
    console.log('[useFeatureFlags] Manual refresh triggered');
    await refreshFeatureFlags();
    await loadFeatures();
  }, [loadFeatures]);

  // Initial load
  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  // Subscribe to Realtime updates
  useEffect(() => {
    console.log('[useFeatureFlags] Setting up Realtime subscription...');

    const subscription = subscribeToFeatureFlags((updatedFeatures) => {
      console.log('[useFeatureFlags] Realtime update received:', updatedFeatures.length, 'features');
      setFeatures(updatedFeatures);
    });

    return () => {
      console.log('[useFeatureFlags] Cleaning up Realtime subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Also listen to localStorage-based events (for backward compatibility)
  useEffect(() => {
    const handleFlagsChanged = () => {
      console.log('[useFeatureFlags] featureFlagsChanged event received');
      loadFeatures();
    };

    window.addEventListener('featureFlagsChanged', handleFlagsChanged);

    return () => {
      window.removeEventListener('featureFlagsChanged', handleFlagsChanged);
    };
  }, [loadFeatures]);

  return {
    features,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for checking if a specific feature is enabled
 *
 * @param featureId - The feature ID to check
 * @returns Boolean indicating if feature is enabled
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isEnabled = useFeatureEnabled('file_browser');
 *
 *   if (!isEnabled) return null;
 *
 *   return <FileBrowser />;
 * }
 * ```
 */
export function useFeatureEnabled(featureId: string): boolean {
  const { features } = useFeatureFlags();
  const feature = features.find((f) => f.id === featureId);
  return feature?.enabled ?? false;
}

/**
 * Hook for getting a specific feature flag
 *
 * @param featureId - The feature ID to get
 * @returns The feature flag or null if not found
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const feature = useFeatureFlag('file_browser');
 *
 *   if (!feature) return <div>Feature not found</div>;
 *
 *   return (
 *     <div>
 *       {feature.name}: {feature.enabled ? 'Enabled' : 'Disabled'}
 *       Roles: {feature.allowedRoles.join(', ')}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlag(featureId: string): FeatureFlag | null {
  const { features } = useFeatureFlags();
  return features.find((f) => f.id === featureId) ?? null;
}
