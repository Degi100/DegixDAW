// src/hooks/useAdmin.ts
// Admin detection and authorization hook

import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  isBetaUser: boolean;
  isRegularAdmin: boolean;
  loading: boolean;
  adminLevel: 'none' | 'admin' | 'super_admin';
  canAccessRoute: (routeId: string) => boolean;
}

export function useAdmin(): AdminStatus {
  const { user, loading } = useAuth();
  
  const adminStatus = useMemo(() => {
    if (!user || loading) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        isModerator: false,
        isBetaUser: false,
        isRegularAdmin: false,
        loading: loading,
        adminLevel: 'none' as const,
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

    // Check Beta User via user metadata
    const isBetaUser = user.user_metadata?.is_beta_user === true;

    // Admins (moderators are NOT admins, they have limited permissions)
    const isAdmin = isSuperAdmin || isRegularAdmin;

    return {
      isAdmin,
      isSuperAdmin,
      isModerator,
      isBetaUser,
      isRegularAdmin,
      loading: false,
      adminLevel: isSuperAdmin ? 'super_admin' as const :
                  isRegularAdmin ? 'admin' as const :
                  'none' as const,
      canAccessRoute: (routeId: string) => {
        // Super-Admin/Admin → alles
        if (isSuperAdmin || isRegularAdmin) return true;

        // Moderator → Issues + Settings + Versions
        if (isModerator && (routeId === 'issues' || routeId === 'settings' || routeId === 'versions')) {
          return true;
        }

        // Sonst nix
        return false;
      }
    };
  }, [user, loading]);

  return adminStatus;
}