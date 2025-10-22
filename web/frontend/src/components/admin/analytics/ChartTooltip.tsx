/**
 * ChartTooltip Component
 *
 * Custom Recharts Tooltip with detailed breakdown
 * Shows TypeScript/JSON/Other breakdown when available
 */

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="growth-tooltip">
      <p className="growth-tooltip__date">{label}</p>
      {payload.map((entry: any, index: number) => {
        const breakdown = entry.payload?.breakdown;

        return (
          <div key={index} className="growth-tooltip__item">
            <p style={{ color: entry.color, marginBottom: '4px' }}>
              <strong>{entry.name}: {entry.value.toLocaleString()} LOC</strong>
            </p>

            {/* TypeScript Breakdown */}
            {breakdown && entry.dataKey === 'typescript' && breakdown.typescript && (
              <div style={{ fontSize: '0.85em', paddingLeft: '12px', opacity: 0.9 }}>
                {breakdown.typescript.frontend > 0 && <div>├─ Frontend: {breakdown.typescript.frontend.toLocaleString()}</div>}
                {breakdown.typescript.backend > 0 && <div>├─ Backend: {breakdown.typescript.backend.toLocaleString()}</div>}
                {breakdown.typescript.packages > 0 && <div>└─ Packages: {breakdown.typescript.packages.toLocaleString()}</div>}
              </div>
            )}

            {/* JSON Breakdown */}
            {breakdown && entry.dataKey === 'json' && breakdown.json && (
              <div style={{ fontSize: '0.85em', paddingLeft: '12px', opacity: 0.9 }}>
                {breakdown.json.packageLock > 0 && <div>├─ package-lock: {breakdown.json.packageLock.toLocaleString()}</div>}
                {breakdown.json.configs > 0 && <div>├─ Configs: {breakdown.json.configs.toLocaleString()}</div>}
                {breakdown.json.other > 0 && <div>└─ Other: {breakdown.json.other.toLocaleString()}</div>}
              </div>
            )}

            {/* Other Files Breakdown */}
            {breakdown && entry.dataKey === 'other' && breakdown.other && (
              <div style={{ fontSize: '0.85em', paddingLeft: '12px', opacity: 0.9 }}>
                {breakdown.other.yml > 0 && <div>├─ YML: {breakdown.other.yml}</div>}
                {breakdown.other.toml > 0 && <div>├─ TOML: {breakdown.other.toml}</div>}
                {breakdown.other.bat > 0 && <div>├─ BAT: {breakdown.other.bat}</div>}
                {breakdown.other.html > 0 && <div>└─ HTML: {breakdown.other.html}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
