/**
 * CodeGrowthChart Component
 *
 * Shows code development over time
 * Metrics: LOC, TypeScript, JavaScript, C++, SCSS, CSS, SQL, JSON, Markdown, Other
 *
 * Uses real historical data from project_snapshots table
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, Brush } from 'recharts';
import { getSnapshots } from '../../../lib/services/analytics/snapshotsService';
import '../../../styles/components/analytics/GrowthChart.scss';

interface CodeDataPoint {
  date: string;
  rawDate?: Date; // For filtering
  total: number;
  typescript: number;
  javascript: number;
  cpp: number;
  scss: number;
  css: number;
  sql: number;
  json: number;
  markdown: number;
  other: number;
  breakdown?: any; // Detailed breakdown for tooltips
}

interface Milestone {
  date: string;
  loc: number;
  type: 'threshold' | 'big_jump' | 'first_cpp' | 'special';
  label: string;
  emoji: string;
}

type TimeRange = '3d' | '7d' | '14d' | '1m' | '3m' | '6m' | '1y' | 'all';

export function CodeGrowthChart() {
  const [visibleLines, setVisibleLines] = useState({
    total: true,
    typescript: false,
    javascript: false,
    cpp: false,
    scss: false,
    css: false,
    sql: false,
    json: false,
    markdown: false,
    other: false
  });

  const [chartData, setChartData] = useState<CodeDataPoint[]>([]);
  const [allData, setAllData] = useState<CodeDataPoint[]>([]); // Store all data for filtering
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [usingRealData, setUsingRealData] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Load historical snapshots from database
  useEffect(() => {
    loadSnapshotData();
  }, []);

  const loadSnapshotData = async () => {
    try {
      console.log('[CodeGrowthChart] Loading snapshots...');
      const snapshots = await getSnapshots(365); // Load more data for longer time ranges

      if (snapshots.length > 0) {
        // Convert snapshots to chart data
        const data = snapshots
          .reverse() // Oldest first
          .map((snapshot) => ({
            date: new Date(snapshot.snapshot_date).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'short'
            }),
            rawDate: new Date(snapshot.snapshot_date), // Store raw date for filtering
            total: snapshot.total_loc,
            typescript: snapshot.typescript_loc || 0,
            javascript: snapshot.javascript_loc || 0,
            cpp: snapshot.cpp_loc || 0,
            scss: snapshot.scss_loc || 0,
            css: snapshot.css_loc || 0,
            sql: snapshot.sql_loc || 0,
            json: snapshot.json_loc || 0,
            markdown: snapshot.markdown_loc || 0,
            other: snapshot.other_loc || 0,
            breakdown: (snapshot as any).breakdown // Include breakdown for tooltips
          }));

        setAllData(data); // Store all data
        setChartData(data); // Show all by default
        setMilestones(detectMilestones(data));
        setUsingRealData(true);
        console.log(`[CodeGrowthChart] ✅ Loaded ${snapshots.length} snapshots`);
      } else {
        // No snapshots found - show empty chart
        console.warn('[CodeGrowthChart] No snapshots found');
        setAllData([]);
        setChartData([]);
        setUsingRealData(false);
      }
    } catch (error) {
      console.error('[CodeGrowthChart] Failed to load snapshots:', error);
      setAllData([]);
      setChartData([]);
      setUsingRealData(false);
    }
  };

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter data based on time range
  useEffect(() => {
    if (allData.length === 0) return;

    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '3d':
        cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '14d':
        cutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        setChartData(allData);
        setMilestones(detectMilestones(allData));
        return;
    }

    const filtered = allData.filter((d: any) => d.rawDate >= cutoffDate);
    setChartData(filtered);
    setMilestones(detectMilestones(filtered));
  }, [timeRange, allData]);

  // Detect milestones from chart data
  const detectMilestones = (data: CodeDataPoint[]) => {
    const detectedMilestones: Milestone[] = [];
    const thresholds = [10000, 25000, 50000, 75000, 100000];

    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      const previous = i > 0 ? data[i - 1] : null;

      // 1. Threshold milestones (10k, 25k, 50k, etc.)
      if (previous) {
        for (const threshold of thresholds) {
          if (previous.total < threshold && current.total >= threshold) {
            detectedMilestones.push({
              date: current.date,
              loc: current.total,
              type: 'threshold',
              label: `${(threshold / 1000)}k LOC`,
              emoji: '🎯'
            });
          }
        }
      }

      // 2. Big jumps (>10k LOC increase in one day)
      if (previous) {
        const jump = current.total - previous.total;
        if (jump > 10000) {
          detectedMilestones.push({
            date: current.date,
            loc: current.total,
            type: 'big_jump',
            label: `+${(jump / 1000).toFixed(1)}k`,
            emoji: '📈'
          });
        }
      }

      // 3. First C++ code
      if (previous && previous.cpp === 0 && current.cpp > 0) {
        detectedMilestones.push({
          date: current.date,
          loc: current.total,
          type: 'first_cpp',
          label: 'First C++',
          emoji: '⚙️'
        });
      }
    }

    return detectedMilestones;
  };

  // Custom Tooltip with detailed breakdown
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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

                {/* Detailed breakdown for specific categories */}
                {breakdown && entry.dataKey === 'typescript' && breakdown.typescript && (
                  <div style={{ fontSize: '0.85em', paddingLeft: '12px', opacity: 0.9 }}>
                    {breakdown.typescript.frontend > 0 && <div>├─ Frontend: {breakdown.typescript.frontend.toLocaleString()}</div>}
                    {breakdown.typescript.backend > 0 && <div>├─ Backend: {breakdown.typescript.backend.toLocaleString()}</div>}
                    {breakdown.typescript.packages > 0 && <div>└─ Packages: {breakdown.typescript.packages.toLocaleString()}</div>}
                  </div>
                )}

                {breakdown && entry.dataKey === 'json' && breakdown.json && (
                  <div style={{ fontSize: '0.85em', paddingLeft: '12px', opacity: 0.9 }}>
                    {breakdown.json.packageLock > 0 && <div>├─ package-lock: {breakdown.json.packageLock.toLocaleString()}</div>}
                    {breakdown.json.configs > 0 && <div>├─ Configs: {breakdown.json.configs.toLocaleString()}</div>}
                    {breakdown.json.other > 0 && <div>└─ Other: {breakdown.json.other.toLocaleString()}</div>}
                  </div>
                )}

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
    return null;
  };

  // Get current values (last data point) for active lines
  const getCurrentValues = () => {
    if (chartData.length === 0) return [];

    const lastPoint = chartData[chartData.length - 1];
    const values = [];

    if (visibleLines.total) values.push({ label: 'Total LOC', value: lastPoint.total, color: '#3b82f6' });
    if (visibleLines.typescript) values.push({ label: 'TypeScript', value: lastPoint.typescript, color: '#3178c6' });
    if (visibleLines.javascript) values.push({ label: 'JavaScript', value: lastPoint.javascript, color: '#f7df1e' });
    if (visibleLines.cpp) values.push({ label: 'C++', value: lastPoint.cpp, color: '#659ad2' });
    if (visibleLines.scss) values.push({ label: 'SCSS', value: lastPoint.scss, color: '#cc6699' });
    if (visibleLines.css) values.push({ label: 'CSS', value: lastPoint.css, color: '#264de4' });
    if (visibleLines.sql) values.push({ label: 'SQL', value: lastPoint.sql, color: '#00758f' });
    if (visibleLines.json) values.push({ label: 'JSON', value: lastPoint.json, color: '#f59e0b' });
    if (visibleLines.markdown) values.push({ label: 'Markdown', value: lastPoint.markdown, color: '#10b981' });
    if (visibleLines.other) values.push({ label: 'Other', value: lastPoint.other, color: '#9ca3af' });

    // Sort by value (highest first)
    return values.sort((a, b) => b.value - a.value);
  };

  return (
    <div className="growth-chart">
      <div className="growth-chart__header">
        <h2>💻 Code Growth</h2>

        {/* Time Range Filters */}
        <div className="growth-chart__time-filters">
          <button
            className={`time-filter ${timeRange === '3d' ? 'active' : ''}`}
            onClick={() => setTimeRange('3d')}
          >
            3 Tage
          </button>
          <button
            className={`time-filter ${timeRange === '7d' ? 'active' : ''}`}
            onClick={() => setTimeRange('7d')}
          >
            7 Tage
          </button>
          <button
            className={`time-filter ${timeRange === '14d' ? 'active' : ''}`}
            onClick={() => setTimeRange('14d')}
          >
            14 Tage
          </button>
          <button
            className={`time-filter ${timeRange === '1m' ? 'active' : ''}`}
            onClick={() => setTimeRange('1m')}
          >
            1 Monat
          </button>
          <button
            className={`time-filter ${timeRange === '3m' ? 'active' : ''}`}
            onClick={() => setTimeRange('3m')}
          >
            3 Monate
          </button>
          <button
            className={`time-filter ${timeRange === '6m' ? 'active' : ''}`}
            onClick={() => setTimeRange('6m')}
          >
            6 Monate
          </button>
          <button
            className={`time-filter ${timeRange === '1y' ? 'active' : ''}`}
            onClick={() => setTimeRange('1y')}
          >
            1 Jahr
          </button>
          <button
            className={`time-filter ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            Alle
          </button>
        </div>

        <div className="growth-chart__toggles">
          <button
            className={`toggle ${visibleLines.total ? 'active' : ''}`}
            onClick={() => toggleLine('total')}
            style={{ borderColor: visibleLines.total ? '#3b82f6' : 'var(--border-color)' }}
          >
            📝 Total LOC
          </button>
          <button
            className={`toggle ${visibleLines.typescript ? 'active' : ''}`}
            onClick={() => toggleLine('typescript')}
            style={{ borderColor: visibleLines.typescript ? '#3178c6' : 'var(--border-color)' }}
          >
            📘 TypeScript
          </button>
          <button
            className={`toggle ${visibleLines.javascript ? 'active' : ''}`}
            onClick={() => toggleLine('javascript')}
            style={{ borderColor: visibleLines.javascript ? '#f7df1e' : 'var(--border-color)' }}
          >
            📙 JavaScript
          </button>
          <button
            className={`toggle ${visibleLines.cpp ? 'active' : ''}`}
            onClick={() => toggleLine('cpp')}
            style={{ borderColor: visibleLines.cpp ? '#659ad2' : 'var(--border-color)' }}
          >
            ⚙️ C++
          </button>
          <button
            className={`toggle ${visibleLines.scss ? 'active' : ''}`}
            onClick={() => toggleLine('scss')}
            style={{ borderColor: visibleLines.scss ? '#cc6699' : 'var(--border-color)' }}
          >
            💅 SCSS
          </button>
          <button
            className={`toggle ${visibleLines.css ? 'active' : ''}`}
            onClick={() => toggleLine('css')}
            style={{ borderColor: visibleLines.css ? '#264de4' : 'var(--border-color)' }}
          >
            🎨 CSS
          </button>
          <button
            className={`toggle ${visibleLines.sql ? 'active' : ''}`}
            onClick={() => toggleLine('sql')}
            style={{ borderColor: visibleLines.sql ? '#00758f' : 'var(--border-color)' }}
          >
            🗄️ SQL
          </button>
          <button
            className={`toggle ${visibleLines.json ? 'active' : ''}`}
            onClick={() => toggleLine('json')}
            style={{ borderColor: visibleLines.json ? '#f59e0b' : 'var(--border-color)' }}
          >
            📦 JSON
          </button>
          <button
            className={`toggle ${visibleLines.markdown ? 'active' : ''}`}
            onClick={() => toggleLine('markdown')}
            style={{ borderColor: visibleLines.markdown ? '#10b981' : 'var(--border-color)' }}
          >
            📝 Markdown
          </button>
          <button
            className={`toggle ${visibleLines.other ? 'active' : ''}`}
            onClick={() => toggleLine('other')}
            style={{ borderColor: visibleLines.other ? '#9ca3af' : 'var(--border-color)' }}
          >
            📄 Other
          </button>
        </div>
      </div>

      {/* Chart Container - Full Width */}
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {visibleLines.total && (
            <Line
              type="monotone"
              dataKey="total"
              name="Total LOC"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.typescript && (
            <Line
              type="monotone"
              dataKey="typescript"
              name="TypeScript"
              stroke="#3178c6"
              strokeWidth={2}
              dot={{ fill: '#3178c6', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.javascript && (
            <Line
              type="monotone"
              dataKey="javascript"
              name="JavaScript"
              stroke="#f7df1e"
              strokeWidth={2}
              dot={{ fill: '#f7df1e', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.cpp && (
            <Line
              type="monotone"
              dataKey="cpp"
              name="C++"
              stroke="#659ad2"
              strokeWidth={2}
              dot={{ fill: '#659ad2', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.scss && (
            <Line
              type="monotone"
              dataKey="scss"
              name="SCSS"
              stroke="#cc6699"
              strokeWidth={2}
              dot={{ fill: '#cc6699', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.css && (
            <Line
              type="monotone"
              dataKey="css"
              name="CSS"
              stroke="#264de4"
              strokeWidth={2}
              dot={{ fill: '#264de4', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.sql && (
            <Line
              type="monotone"
              dataKey="sql"
              name="SQL"
              stroke="#00758f"
              strokeWidth={2}
              dot={{ fill: '#00758f', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.json && (
            <Line
              type="monotone"
              dataKey="json"
              name="JSON"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.markdown && (
            <Line
              type="monotone"
              dataKey="markdown"
              name="Markdown"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.other && (
            <Line
              type="monotone"
              dataKey="other"
              name="Other"
              stroke="#9ca3af"
              strokeWidth={2}
              dot={{ fill: '#9ca3af', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

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

      {/* Current Values Below Chart - Better Readability */}
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
