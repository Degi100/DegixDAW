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
        adminLevel: 'none' as const
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

    return {
      isAdmin,
      isSuperAdmin,
      isModerator,
      loading: false,
      adminLevel: isSuperAdmin ? 'super_admin' as const : 
                  isRegularAdmin ? 'admin' as const : 
                  'none' as const
    };
  }, [user, loading]);

  return adminStatus;
}