/**
 * AutoRefreshSettings Component
 *
 * UI controls for auto-refresh functionality
 * - Enable/Disable Toggle
 * - Interval Selector
 * - Countdown Display
 */

import { REFRESH_INTERVALS, type AutoRefreshReturn } from '../../../hooks/useAutoRefresh';
import './AutoRefreshSettings.scss';

interface AutoRefreshSettingsProps {
  autoRefresh: AutoRefreshReturn;
}

const INTERVAL_OPTIONS = [
  { value: REFRESH_INTERVALS.TEN_SECONDS, label: '10s' },
  { value: REFRESH_INTERVALS.THIRTY_SECONDS, label: '30s' },
  { value: REFRESH_INTERVALS.ONE_MINUTE, label: '1m' },
  { value: REFRESH_INTERVALS.FIVE_MINUTES, label: '5m' }
];

export function AutoRefreshSettings({ autoRefresh }: AutoRefreshSettingsProps) {
  const { enabled, setEnabled, interval, setInterval, countdown, isPaused } = autoRefresh;

  const formatCountdown = (seconds: number): string => {
    if (seconds === 0) return '--';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="auto-refresh-settings">
      {/* Toggle */}
      <div className="auto-refresh-settings__toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="toggle-switch__slider"></span>
        </label>
        <span className="auto-refresh-settings__label">
          Auto-Refresh
          {isPaused && <span className="paused-indicator"> (Paused)</span>}
        </span>
      </div>

      {/* Interval Selector */}
      {enabled && (
        <>
          <span className="auto-refresh-settings__separator">Every</span>
          <div className="auto-refresh-settings__intervals">
            {INTERVAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`interval-btn ${interval === option.value ? 'active' : ''}`}
                onClick={() => setInterval(option.value)}
                disabled={!enabled}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Countdown */}
          {countdown > 0 && !isPaused && (
            <div className="auto-refresh-settings__countdown">
              <span className="countdown-icon">⏱️</span>
              <span className="countdown-time">{formatCountdown(countdown)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
