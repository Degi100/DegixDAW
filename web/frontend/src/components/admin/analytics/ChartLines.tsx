/**
 * ChartLines Component
 *
 * Renders all chart lines dynamically using config-array pattern
 * Instead of 10x <Line> copy-paste, we map over a config array
 */

import { Line } from 'recharts';
import type { VisibleLines } from '../../../hooks/useCodeGrowth';

interface LineConfig {
  key: keyof VisibleLines;
  name: string;
  color: string;
  strokeWidth: number;
  dotRadius: number;
  activeDotRadius: number;
}

// Config-Array (DRY Principle!)
const LINE_CONFIGS: LineConfig[] = [
  { key: 'total', name: 'Total LOC', color: '#3b82f6', strokeWidth: 3, dotRadius: 4, activeDotRadius: 6 },
  { key: 'typescript', name: 'TypeScript', color: '#3178c6', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'javascript', name: 'JavaScript', color: '#f7df1e', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'cpp', name: 'C++', color: '#659ad2', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'scss', name: 'SCSS', color: '#cc6699', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'css', name: 'CSS', color: '#264de4', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'sql', name: 'SQL', color: '#00758f', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'json', name: 'JSON', color: '#f59e0b', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'markdown', name: 'Markdown', color: '#10b981', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 },
  { key: 'other', name: 'Other', color: '#9ca3af', strokeWidth: 2, dotRadius: 3, activeDotRadius: 5 }
];

interface ChartLinesProps {
  visibleLines: VisibleLines;
}

export function ChartLines({ visibleLines }: ChartLinesProps) {
  return (
    <>
      {LINE_CONFIGS.map(({ key, name, color, strokeWidth, dotRadius, activeDotRadius }) => {
        if (!visibleLines[key]) return null;

        return (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={{ fill: color, r: dotRadius }}
            activeDot={{ r: activeDotRadius }}
          />
        );
      })}
    </>
  );
}
