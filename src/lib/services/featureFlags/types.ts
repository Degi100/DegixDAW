// ============================================
// FEATURE FLAGS - TYPE DEFINITIONS
// TypeScript types for Feature Flags system
// ============================================

/**
 * User roles for feature access control
 */
export type UserRole = 'public' | 'user' | 'moderator' | 'admin';

/**
 * Feature category for grouping
 */
export type FeatureCategory = 'core' | 'chat' | 'social' | 'files' | 'cloud' | 'admin' | 'general';

/**
 * Feature Flag from database (snake_case)
 */
export interface FeatureFlagDB {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  allowed_roles: UserRole[]; // JSONB array from DB
  version: string;
  category: FeatureCategory;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Feature Flag for client use (camelCase)
 */
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  allowedRoles: UserRole[];
  version: string;
  category: FeatureCategory;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Feature Flag update payload
 */
export interface FeatureFlagUpdate {
  enabled?: boolean;
  allowedRoles?: UserRole[];
  name?: string;
  description?: string;
  version?: string;
  category?: FeatureCategory;
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Feature access check result
 */
export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: 'feature_disabled' | 'feature_not_found' | 'insufficient_role' | 'not_authenticated';
}
