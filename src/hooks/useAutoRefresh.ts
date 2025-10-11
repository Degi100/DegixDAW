/**
 * useAutoRefresh Hook
 *
 * Auto-refresh functionality with configurable interval
 * - Enable/Disable toggle
 * - Interval selection (10s, 30s, 60s, 5min)
 * - Visual countdown
 * - Pause/Resume
 *
 * Usage:
 * const { enabled, interval, countdown, setEnabled, setInterval, pause, resume } =
 *   useAutoRefresh(refreshCallback, { defaultInterval: 30000, defaultEnabled: false });
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoRefreshOptions {
  defaultInterval?: number; // milliseconds
  defaultEnabled?: boolean;
}

export interface AutoRefreshReturn {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  interval: number;
  setInterval: (interval: number) => void;
  countdown: number; // seconds remaining
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
}

/**
 * Available refresh intervals (in milliseconds)
 */
export const REFRESH_INTERVALS = {
  TEN_SECONDS: 10000,
  THIRTY_SECONDS: 30000,
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000
} as const;

/**
 * Auto-Refresh Hook
 */
export function useAutoRefresh(
  refreshCallback: () => void | Promise<void>,
  options: AutoRefreshOptions = {}
): AutoRefreshReturn {
  const { defaultInterval = REFRESH_INTERVALS.THIRTY_SECONDS, defaultEnabled = false } = options;

  const [enabled, setEnabled] = useState(defaultEnabled);
  const [interval, setInterval] = useState(defaultInterval);
  const [countdown, setCountdown] = useState(Math.floor(interval / 1000));
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  /**
   * Clear all intervals
   */
  const clearIntervals = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  /**
   * Start countdown timer
   */
  const startCountdown = useCallback(() => {
    setCountdown(Math.floor(interval / 1000));

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return Math.floor(interval / 1000);
        }
        return prev - 1;
      });
    }, 1000);
  }, [interval]);

  /**
   * Start auto-refresh
   */
  const start = useCallback(() => {
    clearIntervals();

    if (!enabled || isPaused) return;

    // Start countdown
    startCountdown();

    // Set refresh interval
    intervalRef.current = window.setInterval(() => {
      console.log('[AutoRefresh] Triggering refresh...');
      refreshCallback();
    }, interval);

    console.log(`[AutoRefresh] Started with interval: ${interval}ms`);
  }, [enabled, isPaused, interval, refreshCallback, clearIntervals, startCountdown]);

  /**
   * Pause auto-refresh (but keep countdown visible)
   */
  const pause = useCallback(() => {
    console.log('[AutoRefresh] Paused');
    setIsPaused(true);
    clearIntervals();
  }, [clearIntervals]);

  /**
   * Resume auto-refresh
   */
  const resume = useCallback(() => {
    console.log('[AutoRefresh] Resumed');
    setIsPaused(false);
  }, []);

  /**
   * Effect: Start/Stop auto-refresh when enabled/interval/paused changes
   */
  useEffect(() => {
    if (enabled && !isPaused) {
      start();
    } else {
      clearIntervals();
      if (!enabled) {
        setCountdown(0);
      }
    }

    return () => clearIntervals();
  }, [enabled, interval, isPaused, start, clearIntervals]);

  /**
   * Effect: Reset countdown when interval changes
   */
  useEffect(() => {
    if (enabled) {
      setCountdown(Math.floor(interval / 1000));
    }
  }, [interval, enabled]);

  return {
    enabled,
    setEnabled,
    interval,
    setInterval,
    countdown,
    pause,
    resume,
    isPaused
  };
}
