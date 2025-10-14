/**
 * CodeGrowthChart Component
 *
 * Shows code development over time
 * Metrics: LOC, TypeScript, JavaScript, C++, SCSS, CSS, SQL, JSON, Markdown, Other
 *
 * Uses real historical data from project_snapshots table
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSnapshots } from '../../../lib/services/analytics/snapshotsService';
import '../../../styles/components/analytics/GrowthChart.scss';

interface CodeDataPoint {
  date: string;
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
  const [usingRealData, setUsingRealData] = useState(false);

  // Load historical snapshots from database
  useEffect(() => {
    loadSnapshotData();
  }, []);

  const loadSnapshotData = async () => {
    try {
      console.log('[CodeGrowthChart] Loading snapshots...');
      const snapshots = await getSnapshots(30); // Last 30 snapshots

      if (snapshots.length > 0) {
        // Convert snapshots to chart data
        const data = snapshots
          .reverse() // Oldest first
          .map((snapshot) => ({
            date: new Date(snapshot.snapshot_date).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'short'
            }),
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

        setChartData(data);
        setUsingRealData(true);
        console.log(`[CodeGrowthChart] ✅ Loaded ${snapshots.length} snapshots`);
      } else {
        // No snapshots found - show empty chart
        console.warn('[CodeGrowthChart] No snapshots found');
        setChartData([]);
        setUsingRealData(false);
      }
    } catch (error) {
      console.error('[CodeGrowthChart] Failed to load snapshots:', error);
      setChartData([]);
      setUsingRealData(false);
    }
  };

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
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

      <div className="growth-chart__container">
        <ResponsiveContainer width="100%" height={400}>
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
        </LineChart>
      </ResponsiveContainer>

        {/* Current Values Panel */}
        <div className="growth-chart__values">
          <h3>Current Values</h3>
          {getCurrentValues().map((item, index) => (
            <div key={index} className="value-item">
              <span className="value-label" style={{ color: item.color }}>
                {item.label}
              </span>
              <span className="value-number" style={{ color: item.color }}>
                {item.value.toLocaleString()} LOC
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
