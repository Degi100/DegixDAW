// src/hooks/useSystemStats.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SystemStats {
  totalUsers: number;
  storageUsed: string;
  storageTotal: string;
  storagePercentage: number;
  failedLogins: number;
  totalProjects: number;
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    storageUsed: '0 MB',
    storageTotal: '10 GB',
    storagePercentage: 0,
    failedLogins: 0,
    totalProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get failed login attempts from last 24h (mock - needs auth logs table)
      // In production, this would query an auth_logs table
      const failedLogins = Math.floor(Math.random() * 15); // Mock data

      // Get total projects (mock - needs projects table)
      // In production, this would query projects table
      const totalProjects = Math.floor(Math.random() * 50); // Mock data

      // Get storage usage (mock - needs backend API)
      // In production, this would come from backend storage API
      const storageUsedMB = Math.floor(Math.random() * 2400);
      const storageTotalMB = 10 * 1024; // 10 GB in MB
      const storagePercentage = (storageUsedMB / storageTotalMB) * 100;

      setStats({
        totalUsers: totalUsers || 0,
        storageUsed: formatStorage(storageUsedMB),
        storageTotal: '10 GB',
        storagePercentage,
        failedLogins,
        totalProjects
      });
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
      setError('Failed to fetch system stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

function formatStorage(mb: number): string {
  if (mb < 1024) {
    return `${mb.toFixed(0)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
}
