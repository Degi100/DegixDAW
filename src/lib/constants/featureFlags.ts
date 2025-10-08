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

const DEFAULTS: Record<string, FeatureFlag> = {
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

  DASHBOARD: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Haupt-Dashboard mit Statistiken und schnellem Zugriff.',
    enabled: true,
    allowedRoles: ['user', 'moderator', 'admin'],
    version: '2.3.0',
  },

  SOCIAL_FEATURES: {
    id: 'social_features',
    name: 'Social-Funktionen',
    description: 'Freundesliste, Benutzer-Suche und Interaktionen.',
    enabled: true,
    allowedRoles: ['user', 'moderator', 'admin'],
    version: '2.3.0',
  },

  CHAT_SIDEBAR: {
    id: 'chat_sidebar',
    name: 'Chat-Seitenleiste',
    description: 'Komplette Seitenleiste für Konversationen und Kontakte.',
    enabled: true,
    allowedRoles: ['user', 'moderator', 'admin'],
    version: '2.3.0',
  },
};

const STORAGE_KEY = 'app_feature_flags';

// In-memory state of the feature flags, ALWAYS keyed by feature.id
let featureFlagsState: Record<string, FeatureFlag> = {};

// Load flags from localStorage or use defaults, ensuring keys are normalized to feature.id
function loadFeatureFlags() {
  try {
    const storedFlags = localStorage.getItem(STORAGE_KEY);
    console.log(`%c[FeatureFlags] loadFeatureFlags - STORAGE_KEY: "${STORAGE_KEY}"`, 'color: #06b6d4');
    console.log('%c[FeatureFlags] loadFeatureFlags - storedFlags from localStorage:', 'color: #06b6d4', storedFlags);
    
    // Start with a clean, ID-keyed version of DEFAULTS
    const normalizedDefaults: Record<string, FeatureFlag> = {};
    Object.values(DEFAULTS).forEach(flag => {
      normalizedDefaults[flag.id] = JSON.parse(JSON.stringify(flag));
    });

    if (storedFlags) {
      console.log('%c[FeatureFlags] Loading from localStorage', 'color: #3b82f6');
      const parsedStoredFlags = JSON.parse(storedFlags) as Record<string, FeatureFlag>;
      console.log('%c[FeatureFlags] Parsed stored flags:', 'color: #3b82f6', parsedStoredFlags);
      
      // Normalize stored flags as well, in case they have old keys
      const normalizedStored: Record<string, FeatureFlag> = {};
      Object.values(parsedStoredFlags).forEach(flag => {
        if (flag && flag.id) { // Ensure flag is valid
          normalizedStored[flag.id] = flag;
        }
      });

      // Merge defaults with stored values. Stored values overwrite defaults.
      featureFlagsState = { ...normalizedDefaults, ...normalizedStored };

    } else {
      console.log('%c[FeatureFlags] No stored flags found. Initializing with normalized DEFAULTS', 'color: #3b82f6');
      featureFlagsState = normalizedDefaults;
    }
  } catch (error) {
    console.error('Failed to load feature flags', error);
    // Fallback to normalized defaults
    const normalizedDefaults: Record<string, FeatureFlag> = {};
    Object.values(DEFAULTS).forEach(flag => {
      normalizedDefaults[flag.id] = JSON.parse(JSON.stringify(flag));
    });
    featureFlagsState = normalizedDefaults;
  }
  console.log('%c[FeatureFlags] Initial state (normalized):', 'color: #3b82f6', JSON.parse(JSON.stringify(featureFlagsState)));
}

// Save flags to localStorage and notify the app
function saveFeatureFlags() {
  try {
    const dataToSave = JSON.parse(JSON.stringify(featureFlagsState));
    console.log(`%c[FeatureFlags] saveFeatureFlags - STORAGE_KEY: "${STORAGE_KEY}"`, 'color: #f97316');
    console.log('%c[FeatureFlags] saveFeatureFlags - Data to save:', 'color: #f97316', dataToSave);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureFlagsState));
    
    // Verify it was saved
    const verification = localStorage.getItem(STORAGE_KEY);
    console.log('%c[FeatureFlags] saveFeatureFlags - Verification read:', 'color: #f97316', verification);
    
    window.dispatchEvent(new Event('featureFlagsChanged'));
    console.log('%c[FeatureFlags] Save complete and event dispatched.', 'color: #22c55e');
  } catch (error) {
    console.error('Failed to save feature flags', error);
  }
}

// --- Public API ---

// Helper: Check if user can access feature
export function canAccessFeature(
  featureId: string,
  userRole: UserRole = 'public',
  isAdmin: boolean = false
): boolean {
  const feature = featureFlagsState[featureId];
  console.log(`%c[canAccessFeature] Checking feature "${featureId}"`, 'color: #a855f7', {
    featureId,
    userRole,
    isAdmin,
    featureExists: !!feature,
    featureEnabled: feature?.enabled,
    allowedRoles: feature?.allowedRoles,
    hasAccess: feature ? (feature.enabled && (isAdmin || feature.allowedRoles.includes(userRole))) : false
  });
  
  if (!feature) return false;
  
  if (!feature.enabled) return false;
  if (isAdmin) return true;
  return feature.allowedRoles.includes(userRole);
}

// Helper: Get all features for admin panel
export function getAllFeatures(): FeatureFlag[] {
  // Return a deep copy to prevent direct mutation
  const features = JSON.parse(JSON.stringify(Object.values(featureFlagsState)));
  console.log('%c[FeatureFlags] getAllFeatures called. Returning:', 'color: #8b5cf6', features);
  return features;
}

// Helper: Toggle feature (admin action)
export function toggleFeature(featureId: string, enabled: boolean): void {
  console.log(`%c[FeatureFlags] toggleFeature called with id: ${featureId}, enabled: ${enabled}`, 'color: #ef4444');
  if (featureFlagsState[featureId]) {
    featureFlagsState[featureId].enabled = enabled;
    saveFeatureFlags();
  } else {
    console.error(`[FeatureFlags] toggleFeature: Feature with id "${featureId}" not found!`);
  }
}

// Helper: Update allowed roles (admin action)
export function updateAllowedRoles(featureId: string, roles: UserRole[]): void {
  console.log(`%c[FeatureFlags] updateAllowedRoles called with id: ${featureId}, roles:`, 'color: #ef4444', roles);
  if (featureFlagsState[featureId]) {
    featureFlagsState[featureId].allowedRoles = roles;
    saveFeatureFlags();
  } else {
    console.error(`[FeatureFlags] updateAllowedRoles: Feature with id "${featureId}" not found!`);
  }
}

// Helper: Get user role
export function getUserRole(isAdmin: boolean, isModerator: boolean): UserRole {
  if (isAdmin) return 'admin';
  if (isModerator) return 'moderator';
  return 'user';
}

// --- Initialization ---
// Load flags when the module is first imported
loadFeatureFlags();
