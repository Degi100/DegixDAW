// src/hooks/useSystemHealth.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SystemHealth {
  systemStatus: 'online' | 'offline' | 'degraded';
  databaseStatus: 'connected' | 'disconnected' | 'error';
  lastBackup: string | null;
  uptime: string;
  tokensUsed: number;
  tokensMax: number;
  tokensPercentage: number;
}

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>({
    systemStatus: 'online',
    databaseStatus: 'connected',
    lastBackup: null,
    uptime: '0h 0m',
    tokensUsed: 0,
    tokensMax: 200000,
    tokensPercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check database connection
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      const databaseStatus = dbError ? 'error' : 'connected';
      const systemStatus = dbError ? 'degraded' : 'online';

      // Calculate uptime (mock - in production this would come from backend)
      const startTime = new Date(Date.now() - Math.random() * 86400000 * 7); // Random 0-7 days
      const uptime = formatUptime(Date.now() - startTime.getTime());

      // Mock last backup (in production this would come from backend)
      const lastBackup = new Date(Date.now() - Math.random() * 86400000).toISOString();

      // Mock token usage (in production this would come from API)
      // Simulating current session token usage
      const tokensMax = 200000;
      const tokensUsed = Math.floor(30000 + Math.random() * 5000); // Mock: ~30k-35k
      const tokensPercentage = (tokensUsed / tokensMax) * 100;

      setHealth({
        systemStatus,
        databaseStatus,
        lastBackup,
        uptime,
        tokensUsed,
        tokensMax,
        tokensPercentage
      });
    } catch (err) {
      console.error('Failed to check system health:', err);
      setError('Failed to check system health');
      setHealth({
        systemStatus: 'offline',
        databaseStatus: 'disconnected',
        lastBackup: null,
        uptime: '0h 0m',
        tokensUsed: 0,
        tokensMax: 200000,
        tokensPercentage: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Refresh health check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, loading, error, refresh: checkHealth };
}

function formatUptime(ms: number): string {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
