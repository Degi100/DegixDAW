// ============================================
// FEATURE FLAGS SYSTEM
// Admin-controlled feature toggles
// ============================================

export type UserRole = 'public' | 'user' | 'moderator' | 'admin';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  allowedRoles: UserRole[];  // Multi-Select: Welche Rollen haben Zugriff
  version: string;           // Seit welcher Version verfügbar
}

// Legacy support
export interface LegacyFeatureFlag extends FeatureFlag {
  adminOnly?: boolean;   // Deprecated: use allowedRoles
  betaAccess?: boolean;  // Deprecated: use allowedRoles
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  CHAT_SIDEBAR_POLISH: {
    id: 'chat_sidebar_polish',
    name: 'Chat-Sidebar Verbesserungen',
    description: 'Badge-Animationen, Glow-Effekte, optimistisches UI',
    enabled: true,
    allowedRoles: ['public', 'user', 'moderator', 'admin'],  // ✅ Alle
    version: '2.1.0',
  },
  
  FILE_UPLOAD_SYSTEM: {
    id: 'file_upload_system',
    name: 'Datei-Upload System',
    description: 'Upload von Bildern, Videos, Audio in Chats (5MB)',
    enabled: true,
    allowedRoles: ['user', 'moderator', 'admin'],  // ✅ Authentifizierte User
    version: '2.1.0',
  },
  
  FILE_BROWSER: {
    id: 'file_browser',
    name: 'Datei-Browser',
    description: 'Übersicht aller hochgeladenen Dateien mit Filter & Sortierung',
    enabled: true,
    allowedRoles: ['admin'],  // 🔒 Nur Admins (Testing)
    version: '2.2.0',
  },
  
  CLOUD_INTEGRATION: {
    id: 'cloud_integration',
    name: 'Cloud-Integration',
    description: 'Dropbox, Google Drive, OneDrive Integration',
    enabled: false,
    allowedRoles: ['admin'],  // 🔒 Disabled & Admin-only
    version: '2.3.0',
  },
};

// Helper: Check if user can access feature
export function canAccessFeature(
  featureId: string,
  userRole: UserRole = 'public',
  isAdmin: boolean = false
): boolean {
  const feature = FEATURE_FLAGS[featureId];
  if (!feature) return false;
  
  // Feature disabled? → Niemand kann zugreifen
  if (!feature.enabled) return false;
  
  // Admin override: Admins see everything
  if (isAdmin) return true;
  
  // Check if user's role is in allowed roles
  return feature.allowedRoles.includes(userRole);
}

// Helper: Get all features for admin panel
export function getAllFeatures(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS);
}

// Helper: Toggle feature (admin action)
export function toggleFeature(featureId: string, enabled: boolean): void {
  if (FEATURE_FLAGS[featureId]) {
    FEATURE_FLAGS[featureId].enabled = enabled;
    // TODO: Persist to database (supabase: feature_flags table)
  }
}

// Helper: Update allowed roles (admin action)
export function updateAllowedRoles(featureId: string, roles: UserRole[]): void {
  if (FEATURE_FLAGS[featureId]) {
    FEATURE_FLAGS[featureId].allowedRoles = roles;
    // TODO: Persist to database
  }
}

// Helper: Get user role (to be implemented with proper auth)
export function getUserRole(isAdmin: boolean, isModerator: boolean): UserRole {
  if (isAdmin) return 'admin';
  if (isModerator) return 'moderator';
  return 'user';  // authenticated user
}
