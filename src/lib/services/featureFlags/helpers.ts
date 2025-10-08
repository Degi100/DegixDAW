// ============================================
// FEATURE FLAGS - HELPER FUNCTIONS
// Utility functions for Feature Flags
// ============================================

import type { FeatureFlag, FeatureFlagDB, UserRole } from './types';

/**
 * Convert DB feature (snake_case) to client feature (camelCase)
 */
export function dbToClient(dbFeature: FeatureFlagDB): FeatureFlag {
  return {
    id: dbFeature.id,
    name: dbFeature.name,
    description: dbFeature.description,
    enabled: dbFeature.enabled,
    allowedRoles: dbFeature.allowed_roles,
    version: dbFeature.version,
    category: dbFeature.category,
    createdAt: dbFeature.created_at,
    updatedAt: dbFeature.updated_at,
    createdBy: dbFeature.created_by,
    updatedBy: dbFeature.updated_by,
  };
}

/**
 * Convert client feature (camelCase) to DB feature (snake_case)
 */
export function clientToDb(clientFeature: Partial<FeatureFlag>): Partial<FeatureFlagDB> {
  const dbFeature: Partial<FeatureFlagDB> = {};

  if (clientFeature.id !== undefined) dbFeature.id = clientFeature.id;
  if (clientFeature.name !== undefined) dbFeature.name = clientFeature.name;
  if (clientFeature.description !== undefined) dbFeature.description = clientFeature.description;
  if (clientFeature.enabled !== undefined) dbFeature.enabled = clientFeature.enabled;
  if (clientFeature.allowedRoles !== undefined) dbFeature.allowed_roles = clientFeature.allowedRoles;
  if (clientFeature.version !== undefined) dbFeature.version = clientFeature.version;
  if (clientFeature.category !== undefined) dbFeature.category = clientFeature.category;

  return dbFeature;
}

/**
 * Determine user role based on auth metadata
 */
export function getUserRole(
  isAuthenticated: boolean,
  isAdmin: boolean,
  isModerator: boolean
): UserRole {
  if (!isAuthenticated) return 'public';
  if (isAdmin) return 'admin';
  if (isModerator) return 'moderator';
  return 'user';
}

/**
 * Check if user has access to a feature (client-side logic)
 */
export function canAccessFeature(
  feature: FeatureFlag | null | undefined,
  userRole: UserRole,
  isAdmin: boolean
): boolean {
  // Feature not found
  if (!feature) return false;

  // Feature disabled
  if (!feature.enabled) return false;

  // Admins have access to everything
  if (isAdmin) return true;

  // Check if user's role is in allowed roles
  return feature.allowedRoles.includes(userRole);
}

/**
 * Sort features by category and name
 */
export function sortFeatures(features: FeatureFlag[]): FeatureFlag[] {
  const categoryOrder: Record<string, number> = {
    core: 1,
    chat: 2,
    social: 3,
    files: 4,
    cloud: 5,
    admin: 6,
    general: 7,
  };

  return [...features].sort((a, b) => {
    // Sort by category first
    const categoryDiff = (categoryOrder[a.category] || 999) - (categoryOrder[b.category] || 999);
    if (categoryDiff !== 0) return categoryDiff;

    // Then by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Filter features by category
 */
export function filterByCategory(features: FeatureFlag[], category: string): FeatureFlag[] {
  return features.filter((f) => f.category === category);
}

/**
 * Get feature by ID from array
 */
export function getFeatureById(features: FeatureFlag[], featureId: string): FeatureFlag | null {
  return features.find((f) => f.id === featureId) || null;
}

/**
 * Check if feature is accessible by public
 */
export function isPublicFeature(feature: FeatureFlag): boolean {
  return feature.enabled && feature.allowedRoles.includes('public');
}

/**
 * Check if feature is admin-only
 */
export function isAdminOnlyFeature(feature: FeatureFlag): boolean {
  return feature.enabled && feature.allowedRoles.length === 1 && feature.allowedRoles[0] === 'admin';
}

/**
 * Get feature status icon
 */
export function getFeatureStatusIcon(feature: FeatureFlag): string {
  if (!feature.enabled) return '❌';
  if (isPublicFeature(feature)) return '🌍';
  if (isAdminOnlyFeature(feature)) return '🔒';
  if (feature.allowedRoles.includes('moderator')) return '🧪';
  return '✅';
}

/**
 * Get feature status text
 */
export function getFeatureStatusText(feature: FeatureFlag): string {
  if (!feature.enabled) return 'Deaktiviert';
  if (isPublicFeature(feature)) return 'Öffentlich';
  if (isAdminOnlyFeature(feature)) return 'Nur Admins';
  if (feature.allowedRoles.includes('moderator')) return 'Beta';
  return `${feature.allowedRoles.length} Rollen`;
}
