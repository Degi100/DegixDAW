// ============================================================================
// ADMIN ROUTE DEFINITIONS
// ============================================================================
// Definiert alle verfügbaren Admin-Routen und deren Metadaten
// für granulare Permissions-Verwaltung

export interface AdminRouteDefinition {
  id: string;           // Route-ID für Permissions (z.B. "issues")
  path: string;         // URL-Path (z.B. "/admin/issues")
  name: string;         // Display-Name
  icon: string;         // Emoji/Icon
  description: string;  // Beschreibung für Super-Admin UI
}

/**
 * Alle verfügbaren Admin-Routen
 */
export const ADMIN_ROUTES: AdminRouteDefinition[] = [
  {
    id: 'dashboard',
    path: '/admin',
    name: 'Dashboard',
    icon: '📊',
    description: 'Admin Dashboard mit System-Übersicht',
  },
  {
    id: 'users',
    path: '/admin/users',
    name: 'User Management',
    icon: '👥',
    description: 'User-Verwaltung, Rollen & Permissions',
  },
  {
    id: 'issues',
    path: '/admin/issues',
    name: 'Issues',
    icon: '🐛',
    description: 'Issue-Tracking & Bug-Management',
  },
  {
    id: 'settings',
    path: '/admin/settings',
    name: 'Settings',
    icon: '⚙️',
    description: 'Admin-Einstellungen & Konfiguration',
  },
  {
    id: 'features',
    path: '/admin/features',
    name: 'Feature Flags',
    icon: '🚩',
    description: 'Feature-Flag-Verwaltung',
  },
  {
    id: 'versions',
    path: '/admin/settings/versions',
    name: 'Versions',
    icon: '📦',
    description: 'Version-Management',
  },
];

/**
 * Map: Route-ID → Route-Definition (für schnellen Lookup)
 */
export const ADMIN_ROUTES_MAP = new Map<string, AdminRouteDefinition>(
  ADMIN_ROUTES.map((route) => [route.id, route])
);

/**
 * Extrahiert Route-ID aus URL-Path
 * @example extractRouteId('/admin/issues') → 'issues'
 * @example extractRouteId('/admin/settings/versions') → 'versions'
 */
export function extractRouteId(path: string): string | null {
  const route = ADMIN_ROUTES.find((r) => path.startsWith(r.path));
  return route?.id || null;
}

/**
 * Prüft, ob ein Path eine Admin-Route ist
 */
export function isAdminRoute(path: string): boolean {
  return path.startsWith('/admin');
}

/**
 * Default-Routen pro Role (automatischer Zugriff ohne explizite Permission)
 */
export const DEFAULT_ROUTES_BY_ROLE = {
  moderator: ['issues'],                          // Moderatoren bekommen Issues automatisch
  admin: ['dashboard', 'issues', 'features'],     // Admins bekommen Dashboard + Issues + Features
  super_admin: []                                 // Super-Admin hat sowieso Zugriff auf alles
} as const;
