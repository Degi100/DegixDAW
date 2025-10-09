// src/hooks/useAdmin.ts
// Admin detection and authorization hook

import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  adminLevel: 'none' | 'admin' | 'super_admin';
  canAccessRoute: (routeId: string) => boolean;
  allowedRoutes: string[];
}

export function useAdmin(): AdminStatus {
  const { user, loading } = useAuth();
  
  const adminStatus = useMemo(() => {
    if (!user || loading) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        isModerator: false,
        loading: loading,
        adminLevel: 'none' as const,
        allowedRoutes: [],
        canAccessRoute: () => false
      };
    }

    // Check Super Admin via Environment Variable
    const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL;
    const isSuperAdmin = user.email === superAdminEmail;

    // Check regular Admin via user metadata
    const isRegularAdmin = user.user_metadata?.is_admin === true;

    // Check Moderator via user metadata
    const isModerator = user.user_metadata?.is_moderator === true;

    const isAdmin = isSuperAdmin || isRegularAdmin;

    // Get allowed admin routes from user_metadata
    const allowedRoutes: string[] = user.user_metadata?.allowed_admin_routes || [];

    return {
      isAdmin,
      isSuperAdmin,
      isModerator,
      loading: false,
      adminLevel: isSuperAdmin ? 'super_admin' as const :
                  isRegularAdmin ? 'admin' as const :
                  'none' as const,
      allowedRoutes,
      canAccessRoute: (routeId: string) => {
        // Super-Admin hat immer Zugriff auf alle Routen
        if (isSuperAdmin) return true;

        // Kein Admin/Moderator → kein Zugriff
        if (!isAdmin && !isModerator) return false;

        // Prüfe ob Route in erlaubten Routen enthalten ist
        return allowedRoutes.includes(routeId);
      }
    };
  }, [user, loading]);

  return adminStatus;
}