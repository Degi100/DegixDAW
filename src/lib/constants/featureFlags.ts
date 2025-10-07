// ============================================
// FEATURE FLAGS SYSTEM
// Admin-controlled feature toggles
// ============================================

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  adminOnly: boolean;  // Wenn true: nur für Admins sichtbar
  betaAccess: boolean; // Wenn true: für Beta-Tester sichtbar
  version: string;     // Seit welcher Version verfügbar
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  CHAT_SIDEBAR_POLISH: {
    id: 'chat_sidebar_polish',
    name: 'Chat-Sidebar Verbesserungen',
    description: 'Badge-Animationen, Glow-Effekte, optimistisches UI',
    enabled: true,        // ✅ Live für alle
    adminOnly: false,
    betaAccess: false,
    version: '2.1.0',
  },
  
  FILE_UPLOAD_SYSTEM: {
    id: 'file_upload_system',
    name: 'Datei-Upload System',
    description: 'Upload von Bildern, Videos, Audio in Chats (5MB)',
    enabled: true,        // ✅ Live für alle
    adminOnly: false,
    betaAccess: false,
    version: '2.1.0',
  },
  
  FILE_BROWSER: {
    id: 'file_browser',
    name: 'Datei-Browser',
    description: 'Übersicht aller hochgeladenen Dateien mit Filter & Sortierung',
    enabled: true,        // ⚠️ Enabled, aber...
    adminOnly: true,      // 🔒 Nur für Admins sichtbar!
    betaAccess: false,
    version: '2.2.0',
  },
  
  CLOUD_INTEGRATION: {
    id: 'cloud_integration',
    name: 'Cloud-Integration',
    description: 'Dropbox, Google Drive, OneDrive Integration',
    enabled: false,       // ❌ Noch nicht ready
    adminOnly: true,      // 🔒 Nur für Admins (zum Testen)
    betaAccess: false,
    version: '2.3.0',
  },
};

// Helper: Check if user can access feature
export function canAccessFeature(
  featureId: string,
  isAdmin: boolean = false,
  isBetaTester: boolean = false
): boolean {
  const feature = FEATURE_FLAGS[featureId];
  if (!feature) return false;
  
  // Feature disabled? → Niemand kann zugreifen
  if (!feature.enabled) return false;
  
  // Admin-only feature? → Nur Admins
  if (feature.adminOnly && !isAdmin) return false;
  
  // Beta feature? → Nur Beta-Tester oder Admins
  if (feature.betaAccess && !isBetaTester && !isAdmin) return false;
  
  return true;
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
