// ============================================
// FEATURE FLAGS SYSTEM
// ⚠️ DEPRECATED: Use src/lib/services/featureFlags instead
// This file now re-exports from the service layer for backward compatibility
// ============================================

// Re-export types and functions from service layer
export type {
  FeatureFlag,
  FeatureFlagUpdate,
  UserRole,
  FeatureCategory,
} from '../services/featureFlags';

export {
  // Helper functions
  getUserRole,
  canAccessFeature,
  getFeatureStatusIcon,
  getFeatureStatusText,
  sortFeatures,

  // Service functions (for direct use if needed)
  getAllFeatureFlags as getAllFeaturesFromDB,
  updateFeatureFlag,
  toggleFeatureFlag as toggleFeatureFlagInDB,
  updateFeatureRoles as updateFeatureRolesInDB,
} from '../services/featureFlags';

// ============================================
// LEGACY ADAPTER LAYER
// Provides backward compatibility with old API
// ============================================

import { getAllFeatureFlags, toggleFeatureFlag as toggleInService, updateFeatureRoles as updateRolesInService } from '../services/featureFlags';
import type { FeatureFlag, UserRole } from '../services/featureFlags';

// In-memory cache for feature flags (populated from Supabase)
let featureFlagsCache: Record<string, FeatureFlag> = {};
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize feature flags from Supabase
 * Called automatically on first access
 */
async function initializeFeatureFlags(): Promise<void> {
  if (isInitialized) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    console.log('%c[FeatureFlags] Initializing from Supabase...', 'color: #06b6d4');

    const { data, error } = await getAllFeatureFlags();

    if (error) {
      console.error('[FeatureFlags] Failed to load from Supabase:', error);
      // Keep empty cache, will retry on next call
      return;
    }

    if (data) {
      // Convert array to keyed object
      featureFlagsCache = data.reduce((acc, feature) => {
        acc[feature.id] = feature;
        return acc;
      }, {} as Record<string, FeatureFlag>);

      console.log(`%c[FeatureFlags] Loaded ${data.length} features from Supabase`, 'color: #22c55e');
      isInitialized = true;
    }
  })();

  await initPromise;
  initPromise = null;
}

/**
 * Get all feature flags (legacy API)
 * @returns Array of all feature flags
 */
export function getAllFeatures(): FeatureFlag[] {
  // Return cached data immediately (will be empty on first call before async init)
  return Object.values(featureFlagsCache);
}

/**
 * Get all feature flags (async version, recommended)
 * @returns Promise with array of all feature flags
 */
export async function getAllFeaturesAsync(): Promise<FeatureFlag[]> {
  await initializeFeatureFlags();
  return Object.values(featureFlagsCache);
}

/**
 * Toggle feature enabled state (legacy API)
 * @param featureId - Feature ID to toggle
 * @param enabled - New enabled state
 */
export function toggleFeature(featureId: string, enabled: boolean): void {
  // Update optimistically in cache
  if (featureFlagsCache[featureId]) {
    featureFlagsCache[featureId] = {
      ...featureFlagsCache[featureId],
      enabled,
    };
  }

  // Update in Supabase (async, fire-and-forget with error handling)
  toggleInService(featureId, enabled)
    .then(({ data, error }) => {
      if (error) {
        console.error(`[FeatureFlags] Failed to toggle ${featureId}:`, error);
        // Rollback optimistic update on error
        if (featureFlagsCache[featureId]) {
          featureFlagsCache[featureId] = {
            ...featureFlagsCache[featureId],
            enabled: !enabled, // Rollback
          };
        }
        return;
      }

      if (data) {
        // Update cache with server response
        featureFlagsCache[featureId] = data;
        console.log(`%c[FeatureFlags] Toggled ${featureId} to ${enabled}`, 'color: #22c55e');
      }
    });

  // Dispatch event for listeners (backward compatibility)
  window.dispatchEvent(new Event('featureFlagsChanged'));
}

/**
 * Update allowed roles for a feature (legacy API)
 * @param featureId - Feature ID to update
 * @param roles - New allowed roles
 */
export function updateAllowedRoles(featureId: string, roles: UserRole[]): void {
  // Update optimistically in cache
  if (featureFlagsCache[featureId]) {
    featureFlagsCache[featureId] = {
      ...featureFlagsCache[featureId],
      allowedRoles: roles,
    };
  }

  // Update in Supabase (async, fire-and-forget with error handling)
  updateRolesInService(featureId, roles)
    .then(({ data, error }) => {
      if (error) {
        console.error(`[FeatureFlags] Failed to update roles for ${featureId}:`, error);
        // Rollback will happen via Realtime subscription
        return;
      }

      if (data) {
        // Update cache with server response
        featureFlagsCache[featureId] = data;
        console.log(`%c[FeatureFlags] Updated roles for ${featureId}`, 'color: #22c55e');
      }
    });

  // Dispatch event for listeners (backward compatibility)
  window.dispatchEvent(new Event('featureFlagsChanged'));
}

/**
 * Update allowed roles for a feature (async version, recommended)
 * @param featureId - Feature ID to update
 * @param roles - New allowed roles
 * @returns Promise with updated feature or error
 */
export async function updateAllowedRolesAsync(featureId: string, roles: UserRole[]): Promise<{ data: FeatureFlag | null; error: Error | null }> {
  console.log(`%c[FeatureFlags] Updating roles for ${featureId}:`, 'color: #3b82f6', roles);

  // Update optimistically in cache
  const previousRoles = featureFlagsCache[featureId]?.allowedRoles || [];
  if (featureFlagsCache[featureId]) {
    featureFlagsCache[featureId] = {
      ...featureFlagsCache[featureId],
      allowedRoles: roles,
    };
  }

  // Update in Supabase
  const { data, error } = await updateRolesInService(featureId, roles);

  if (error) {
    console.error(`%c[FeatureFlags] Failed to update roles for ${featureId}:`, 'color: #ef4444', error);

    // Rollback optimistic update on error
    if (featureFlagsCache[featureId]) {
      featureFlagsCache[featureId] = {
        ...featureFlagsCache[featureId],
        allowedRoles: previousRoles,
      };
    }

    return { data: null, error };
  }

  if (data) {
    // Update cache with server response
    featureFlagsCache[featureId] = data;
    console.log(`%c[FeatureFlags] Successfully updated roles for ${featureId}`, 'color: #22c55e', data.allowedRoles);

    // Dispatch event for listeners
    window.dispatchEvent(new Event('featureFlagsChanged'));
  }

  return { data, error: null };
}

/**
 * Refresh feature flags from Supabase
 * Useful after Realtime updates or manual refresh
 */
export async function refreshFeatureFlags(): Promise<void> {
  console.log('%c[FeatureFlags] Refreshing from Supabase...', 'color: #f97316');

  const { data, error } = await getAllFeatureFlags();

  if (error) {
    console.error('[FeatureFlags] Failed to refresh:', error);
    return;
  }

  if (data) {
    // Update cache
    featureFlagsCache = data.reduce((acc, feature) => {
      acc[feature.id] = feature;
      return acc;
    }, {} as Record<string, FeatureFlag>);

    console.log(`%c[FeatureFlags] Refreshed ${data.length} features`, 'color: #22c55e');

    // Notify listeners
    window.dispatchEvent(new Event('featureFlagsChanged'));
  }
}

// Auto-initialize on module load
initializeFeatureFlags().catch(console.error);
