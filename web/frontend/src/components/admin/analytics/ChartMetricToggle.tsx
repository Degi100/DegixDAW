/**
 * ChartMetricToggle Component
 *
 * Renders metric toggle buttons using config-array pattern (DRY)
 * Instead of 10x copy-paste, we map over a config array
 */

import type { VisibleLines } from '../../../hooks/useCodeGrowth';

interface MetricConfig {
  key: keyof VisibleLines;
  label: string;
  emoji: string;
  color: string;
}

// Config-Array (DRY Principle!)
const METRIC_CONFIGS: MetricConfig[] = [
  { key: 'total', label: 'Total LOC', emoji: '📝', color: '#3b82f6' },
  { key: 'typescript', label: 'TypeScript', emoji: '📘', color: '#3178c6' },
  { key: 'javascript', label: 'JavaScript', emoji: '📙', color: '#f7df1e' },
  { key: 'cpp', label: 'C++', emoji: '⚙️', color: '#659ad2' },
  { key: 'scss', label: 'SCSS', emoji: '💅', color: '#cc6699' },
  { key: 'css', label: 'CSS', emoji: '🎨', color: '#264de4' },
  { key: 'sql', label: 'SQL', emoji: '🗄️', color: '#00758f' },
  { key: 'json', label: 'JSON', emoji: '📦', color: '#f59e0b' },
  { key: 'markdown', label: 'Markdown', emoji: '📝', color: '#10b981' },
  { key: 'other', label: 'Other', emoji: '📄', color: '#9ca3af' }
];

interface ChartMetricToggleProps {
  visibleLines: VisibleLines;
  onToggle: (key: keyof VisibleLines) => void;
}

export function ChartMetricToggle({ visibleLines, onToggle }: ChartMetricToggleProps) {
  return (
    <div className="growth-chart__toggles">
      {METRIC_CONFIGS.map(({ key, label, emoji, color }) => (
        <button
          key={key}
          className={`toggle ${visibleLines[key] ? 'active' : ''}`}
          onClick={() => onToggle(key)}
          style={{ borderColor: visibleLines[key] ? color : 'var(--border-color)' }}
        >
          {emoji} {label}
        </button>
      ))}
    </div>
  );
}
