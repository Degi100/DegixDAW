// src/hooks/useUserStats.ts
import { useMemo } from 'react';
import type { UserProfile } from './useUserData';

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  admins: number;
  recentSignups: number;
  last24h: number;
  last7d: number;
  last30d: number;
}

export function useUserStats(users: UserProfile[]): UserStats | null {
  return useMemo(() => {
    if (users.length === 0) return null;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: UserStats = {
      total: users.length,
      active: users.filter(u => u.is_active !== false).length,
      inactive: users.filter(u => u.is_active === false).length,
      pending: users.filter(u => !u.profile_created_at).length,
      admins: users.filter(u => u.role === 'admin').length,
      recentSignups: users.filter(u => new Date(u.created_at) > last7d).length,
      last24h: users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > last24h).length,
      last7d: users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > last7d).length,
      last30d: users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > last30d).length
    };

    return stats;
  }, [users]);
}