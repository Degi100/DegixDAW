/**
 * CodeGrowthChart Component
 *
 * Shows code development over time with interactive metrics
 * Refactored: 642 LOC → 161 LOC (75% reduction!)
 *
 * Extracted Components:
 * - useCodeGrowth Hook (State + Data Loading)
 * - TimeRangeFilters (Time Range Buttons)
 * - ChartMetricToggle (Metric Toggle Buttons)
 * - ChartLines (Dynamic Line Rendering)
 * - ChartTooltip (Custom Tooltip with Breakdown)
 */

import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, Brush } from 'recharts';
import { useCodeGrowth } from '../../../hooks/useCodeGrowth';
import { TimeRangeFilters } from './TimeRangeFilters';
import { ChartMetricToggle } from './ChartMetricToggle';
import { ChartLines } from './ChartLines';
import { ChartTooltip } from './ChartTooltip';
import '../../../styles/components/analytics/GrowthChart.scss';

export function CodeGrowthChart() {
  const {
    visibleLines,
    chartData,
    milestones,
    usingRealData,
    timeRange,
    setTimeRange,
    toggleLine,
    getCurrentValues
  } = useCodeGrowth();

  return (
    <div className="growth-chart">
      <div className="growth-chart__header">
        <h2>💻 Code Growth</h2>

        <TimeRangeFilters
          activeRange={timeRange}
          onRangeChange={setTimeRange}
        />

        <ChartMetricToggle
          visibleLines={visibleLines}
          onToggle={toggleLine}
        />
      </div>

      {/* Chart Container */}
      <div className="growth-chart__chart-wrapper">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {/* Dynamic Lines */}
            <ChartLines visibleLines={visibleLines} />

            {/* Milestone Markers */}
            {milestones.map((milestone, index) => {
              const color = milestone.type === 'threshold' ? '#fbbf24' :
                           milestone.type === 'big_jump' ? '#f59e0b' :
                           milestone.type === 'first_cpp' ? '#659ad2' : '#10b981';

              return (
                <ReferenceDot
                  key={index}
                  x={milestone.date}
                  y={milestone.loc}
                  r={8}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                  label={{
                    value: `${milestone.emoji} ${milestone.label}`,
                    position: 'top',
                    fill: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              );
            })}

            {/* Zoom/Brush Tool */}
            <Brush
              dataKey="date"
              height={30}
              stroke="var(--primary-color)"
              fill="var(--bg-secondary)"
              travellerWidth={10}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Values */}
      <div className="growth-chart__current-values">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          📊 Current Values
        </h3>
        <div className="values-grid">
          {getCurrentValues().map((item, index) => (
            <div key={index} className="value-card" style={{
              borderLeft: `3px solid ${item.color}`,
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '0.95rem',
                fontWeight: '500',
                color: 'var(--text-secondary)'
              }}>
                {item.label}
              </span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: item.color,
                fontFamily: 'monospace'
              }}>
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Note */}
      <p className="growth-chart__note">
        {usingRealData ? (
          <>
            ✅ Using real snapshot data ({chartData.length} data points)
          </>
        ) : (
          <>
            ⚠️ No snapshots found. Create snapshots via "📸 Snapshot" button.
          </>
        )}
      </p>
    </div>
  );
}
