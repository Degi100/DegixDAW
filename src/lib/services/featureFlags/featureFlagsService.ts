// ============================================
// FEATURE FLAGS SERVICE
// Supabase integration for Feature Flags CRUD
// ============================================

import { supabase } from '../../supabase';
import type {
  FeatureFlag,
  FeatureFlagDB,
  FeatureFlagUpdate,
  ServiceResponse,
  UserRole,
} from './types';
import { dbToClient } from './helpers';

/**
 * Fetch all feature flags from Supabase
 */
export async function getAllFeatureFlags(): Promise<ServiceResponse<FeatureFlag[]>> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    const features = (data as FeatureFlagDB[]).map(dbToClient);

    return { data: features, error: null };
  } catch (error) {
    console.error('[FeatureFlagsService] Error fetching features:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch a single feature flag by ID
 */
export async function getFeatureFlagById(featureId: string): Promise<ServiceResponse<FeatureFlag>> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', featureId)
      .single();

    if (error) throw error;

    const feature = dbToClient(data as FeatureFlagDB);

    return { data: feature, error: null };
  } catch (error) {
    console.error(`[FeatureFlagsService] Error fetching feature ${featureId}:`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a feature flag (toggle enabled, update roles, etc.)
 */
export async function updateFeatureFlag(
  featureId: string,
  updates: FeatureFlagUpdate
): Promise<ServiceResponse<FeatureFlag>> {
  try {
    // Prepare update payload (snake_case for DB)
    const updatePayload: Partial<FeatureFlagDB> = {};

    if (updates.enabled !== undefined) updatePayload.enabled = updates.enabled;
    if (updates.allowedRoles !== undefined) updatePayload.allowed_roles = updates.allowedRoles;
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.version !== undefined) updatePayload.version = updates.version;
    if (updates.category !== undefined) updatePayload.category = updates.category;

    // Note: updated_by wird durch DB Trigger automatisch gesetzt
    // Wir setzen es nicht manuell um "permission denied for table users" zu vermeiden

    console.log(`%c[FeatureFlagsService] Sending update to Supabase:`, 'color: #f59e0b');
    console.log('  Payload:', updatePayload);

    // Update in database
    const { data, error } = await supabase
      .from('feature_flags')
      .update(updatePayload)
      .eq('id', featureId)
      .select()
      .single();

    console.log(`%c[FeatureFlagsService] Supabase response:`, 'color: #f59e0b');
    console.log('  Data:', data);
    console.log('  Error:', error);

    if (error) throw error;

    const feature = dbToClient(data as FeatureFlagDB);

    console.log(`[FeatureFlagsService] Updated feature ${featureId}:`, feature);

    return { data: feature, error: null };
  } catch (error) {
    console.error(`[FeatureFlagsService] Error updating feature ${featureId}:`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Toggle feature enabled state
 */
export async function toggleFeatureFlag(
  featureId: string,
  enabled: boolean
): Promise<ServiceResponse<FeatureFlag>> {
  return updateFeatureFlag(featureId, { enabled });
}

/**
 * Update allowed roles for a feature
 */
export async function updateFeatureRoles(
  featureId: string,
  roles: UserRole[]
): Promise<ServiceResponse<FeatureFlag>> {
  console.log(`%c[FeatureFlagsService] updateFeatureRoles called:`, 'color: #8b5cf6; font-weight: bold');
  console.log('  Feature ID:', featureId);
  console.log('  New Roles:', roles);

  const result = await updateFeatureFlag(featureId, { allowedRoles: roles });

  console.log(`%c[FeatureFlagsService] updateFeatureRoles result:`, 'color: #8b5cf6; font-weight: bold');
  console.log('  Success:', !!result.data);
  console.log('  Error:', result.error?.message || 'none');
  if (result.data) {
    console.log('  Saved Roles:', result.data.allowedRoles);
  }

  return result;
}

/**
 * Subscribe to feature flags changes (Realtime)
 */
export function subscribeToFeatureFlags(
  callback: (features: FeatureFlag[]) => void
): { unsubscribe: () => void } {
  console.log('[FeatureFlagsService] Setting up realtime subscription...');

  const channel = supabase
    .channel('feature_flags_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'feature_flags',
      },
      async (payload) => {
        console.log('[FeatureFlagsService] Realtime change detected:', payload);

        // Refetch all features on any change
        const { data } = await getAllFeatureFlags();
        if (data) {
          callback(data);
        }
      }
    )
    .subscribe((status) => {
      console.log('[FeatureFlagsService] Realtime subscription status:', status);
    });

  return {
    unsubscribe: () => {
      console.log('[FeatureFlagsService] Unsubscribing from realtime...');
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Check if user can access a feature (uses DB function)
 */
export async function checkFeatureAccess(
  featureId: string,
  userId?: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { data, error } = await supabase.rpc('can_access_feature', {
      p_feature_id: featureId,
      p_user_id: userId || null,
    });

    if (error) throw error;

    return { data: data as boolean, error: null };
  } catch (error) {
    console.error(`[FeatureFlagsService] Error checking access for ${featureId}:`, error);
    return { data: false, error: error as Error };
  }
}

/**
 * Create a new feature flag (admin only)
 */
export async function createFeatureFlag(
  feature: Omit<FeatureFlag, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
): Promise<ServiceResponse<FeatureFlag>> {
  try {
    // Prepare insert payload (snake_case for DB)
    const insertPayload: Omit<FeatureFlagDB, 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> = {
      id: feature.id,
      name: feature.name,
      description: feature.description,
      enabled: feature.enabled,
      allowed_roles: feature.allowedRoles,
      version: feature.version,
      category: feature.category,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('feature_flags')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    const createdFeature = dbToClient(data as FeatureFlagDB);

    console.log('[FeatureFlagsService] Created new feature:', createdFeature);

    return { data: createdFeature, error: null };
  } catch (error) {
    console.error('[FeatureFlagsService] Error creating feature:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a feature flag (admin only, use with caution!)
 */
export async function deleteFeatureFlag(featureId: string): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', featureId);

    if (error) throw error;

    console.log(`[FeatureFlagsService] Deleted feature ${featureId}`);

    return { data: true, error: null };
  } catch (error) {
    console.error(`[FeatureFlagsService] Error deleting feature ${featureId}:`, error);
    return { data: false, error: error as Error };
  }
}
