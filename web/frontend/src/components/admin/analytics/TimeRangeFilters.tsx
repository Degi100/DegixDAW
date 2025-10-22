/**
 * TimeRangeFilters Component
 *
 * Time range filter buttons using config-array pattern
 * Instead of 8x copy-paste, we map over a config array
 */

import type { TimeRange } from '../../../hooks/useCodeGrowth';

interface TimeRangeConfig {
  value: TimeRange;
  label: string;
}

// Config-Array (DRY Principle!)
const TIME_RANGE_CONFIGS: TimeRangeConfig[] = [
  { value: '3d', label: '3 Tage' },
  { value: '7d', label: '7 Tage' },
  { value: '14d', label: '14 Tage' },
  { value: '1m', label: '1 Monat' },
  { value: '3m', label: '3 Monate' },
  { value: '6m', label: '6 Monate' },
  { value: '1y', label: '1 Jahr' },
  { value: 'all', label: 'Alle' }
];

interface TimeRangeFiltersProps {
  activeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export function TimeRangeFilters({ activeRange, onRangeChange }: TimeRangeFiltersProps) {
  return (
    <div className="growth-chart__time-filters">
      {TIME_RANGE_CONFIGS.map(({ value, label }) => (
        <button
          key={value}
          className={`time-filter ${activeRange === value ? 'active' : ''}`}
          onClick={() => onRangeChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
