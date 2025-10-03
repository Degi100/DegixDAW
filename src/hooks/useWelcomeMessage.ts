// src/hooks/useWelcomeMessage.ts
import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useToast } from './useToast';
import { supabase } from '../lib/supabase';

/**
 * Custom hook für intelligente Welcome-Message-Verwaltung
 * Kombiniert session-basierte und tag-basierte Anzeige
 */
export function useWelcomeMessage(user: User | null) {
  const { success } = useToast();

  useEffect(() => {
    if (!user) return;

    const today = new Date().toDateString();
    const sessionKey = `welcome-session-${user.id}`;
    const dailyKey = `welcome-daily-${user.id}`;
    
    // Bereinige alte localStorage-Einträge (älter als 7 Tage)
    cleanupOldWelcomes();
    
    // Prüfe Welcome-Message-Berechtigung
    const shouldShowWelcome = checkWelcomeEligibility(sessionKey, dailyKey, today);
    
    if (shouldShowWelcome) {
      // Hole Username aus profiles-Tabelle
      const fetchProfile = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('user_id', user.id)
            .single();
          
          const fullName = data?.full_name || user.user_metadata?.full_name || user.email;
          const username = data?.username;
          const displayName = username ? `${fullName} (${username})` : fullName;
          success(`Willkommen zurück, ${displayName}!`);
        } catch {
          // Fallback ohne Username
          const displayName = user.user_metadata?.full_name || user.email;
          success(`Willkommen zurück, ${displayName}!`);
        }
      };
      
      fetchProfile();
      
      // Markiere für diese Session und heute
      sessionStorage.setItem(sessionKey, 'true');
      localStorage.setItem(dailyKey, today);
    }
  }, [user, success]);
}

/**
 * Bereinigt alte Welcome-Message-Einträge aus localStorage
 */
function cleanupOldWelcomes(): void {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('welcome-daily-')) {
      const storedDate = localStorage.getItem(key);
      if (storedDate && new Date(storedDate) < sevenDaysAgo) {
        localStorage.removeItem(key);
      }
    }
  });
}

/**
 * Prüft ob eine Welcome-Message angezeigt werden soll
 */
function checkWelcomeEligibility(sessionKey: string, dailyKey: string, today: string): boolean {
  // Prüfe Session (verschwindet beim Browser-Schließen)
  const hasShownInSession = sessionStorage.getItem(sessionKey);
  
  // Prüfe heutigen Tag (bleibt bis Mitternacht)
  const lastShownDate = localStorage.getItem(dailyKey);
  const hasShownToday = lastShownDate === today;
  
  // Zeige nur wenn: nicht in Session UND nicht heute gezeigt
  return !hasShownInSession && !hasShownToday;
}