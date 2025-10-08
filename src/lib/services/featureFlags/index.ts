// ============================================
// FEATURE FLAGS - BARREL EXPORT
// Centralized exports for Feature Flags service
// ============================================

// Types
export type {
  FeatureFlag,
  FeatureFlagDB,
  FeatureFlagUpdate,
  UserRole,
  FeatureCategory,
  ServiceResponse,
  AccessCheckResult,
} from './types';

// Service functions
export {
  getAllFeatureFlags,
  getFeatureFlagById,
  updateFeatureFlag,
  toggleFeatureFlag,
  updateFeatureRoles,
  subscribeToFeatureFlags,
  checkFeatureAccess,
  createFeatureFlag,
  deleteFeatureFlag,
} from './featureFlagsService';

// Helper functions
export {
  dbToClient,
  clientToDb,
  getUserRole,
  canAccessFeature,
  sortFeatures,
  filterByCategory,
  getFeatureById,
  isPublicFeature,
  isAdminOnlyFeature,
  getFeatureStatusIcon,
  getFeatureStatusText,
} from './helpers';
