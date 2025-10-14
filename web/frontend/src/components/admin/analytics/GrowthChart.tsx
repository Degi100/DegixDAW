/**
 * GrowthChart Component
 *
 * Multi-line chart showing project growth over time
 * Toggleable metrics: LOC, Users, Messages, Storage
 *
 * Uses real historical data from project_snapshots table
 * Falls back to mock data if no snapshots available
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSnapshots } from '../../../lib/services/analytics/snapshotsService';
import type { ProjectMetrics, StorageStats } from '../../../lib/services/analytics/types';
import '../../../styles/components/analytics/GrowthChart.scss';

interface GrowthChartProps {
  metrics: ProjectMetrics;
  storage: StorageStats;
}

interface ChartDataPoint {
  date: string;
  loc: number;
  users: number;
  messages: number;
  storage_mb: number;
  // Language Breakdown
  typescript: number;
  javascript: number;
  cpp: number;
  scss: number;
  css: number;
  sql: number;
  json: number;
  markdown: number;
}

export function GrowthChart({ metrics, storage }: GrowthChartProps) {
  const [visibleLines, setVisibleLines] = useState({
    loc: true,
    users: true,
    messages: false,
    storage: false,
    typescript: false,
    javascript: false,
    cpp: false,
    scss: false,
    css: false,
    sql: false,
    json: false,
    markdown: false
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [usingRealData, setUsingRealData] = useState(false);

  // Load historical snapshots from database
  useEffect(() => {
    loadSnapshotData();
  }, []);

  const loadSnapshotData = async () => {
    try {
      console.log('[GrowthChart] Loading snapshots...');
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
            loc: snapshot.total_loc,
            users: snapshot.total_users,
            messages: snapshot.total_messages,
            storage_mb: snapshot.total_storage_mb,
            typescript: snapshot.typescript_loc || 0,
            javascript: snapshot.javascript_loc || 0,
            cpp: snapshot.cpp_loc || 0,
            scss: snapshot.scss_loc || 0,
            css: snapshot.css_loc || 0,
            sql: snapshot.sql_loc || 0,
            json: snapshot.json_loc || 0,
            markdown: snapshot.markdown_loc || 0
          }));

        setChartData(data);
        setUsingRealData(true);
        console.log(`[GrowthChart] ✅ Loaded ${snapshots.length} snapshots`);
      } else {
        // No snapshots found - show empty chart
        console.warn('[GrowthChart] No snapshots found');
        setChartData([]);
        setUsingRealData(false);
      }
    } catch (error) {
      console.error('[GrowthChart] Failed to load snapshots:', error);
      setChartData([]);
      setUsingRealData(false);
    }
  };

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="growth-tooltip">
          <p className="growth-tooltip__date">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="growth-tooltip__item" style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
              {entry.dataKey === 'storage_mb' && ' MB'}
            </p>
          ))}
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

    if (visibleLines.loc) values.push({ label: 'Total LOC', value: lastPoint.loc, color: '#3b82f6' });
    if (visibleLines.users) values.push({ label: 'Users', value: lastPoint.users, color: '#8b5cf6' });
    if (visibleLines.messages) values.push({ label: 'Messages', value: lastPoint.messages, color: '#06b6d4' });
    if (visibleLines.storage) values.push({ label: 'Storage', value: `${lastPoint.storage_mb.toFixed(1)} MB`, color: '#f59e0b' });
    if (visibleLines.typescript) values.push({ label: 'TypeScript', value: lastPoint.typescript, color: '#3178c6' });
    if (visibleLines.javascript) values.push({ label: 'JavaScript', value: lastPoint.javascript, color: '#f7df1e' });
    if (visibleLines.cpp) values.push({ label: 'C++', value: lastPoint.cpp, color: '#659ad2' });
    if (visibleLines.scss) values.push({ label: 'SCSS', value: lastPoint.scss, color: '#cc6699' });
    if (visibleLines.css) values.push({ label: 'CSS', value: lastPoint.css, color: '#264de4' });
    if (visibleLines.sql) values.push({ label: 'SQL', value: lastPoint.sql, color: '#00758f' });
    if (visibleLines.json) values.push({ label: 'JSON', value: lastPoint.json, color: '#5a5a5a' });
    if (visibleLines.markdown) values.push({ label: 'Markdown', value: lastPoint.markdown, color: '#083fa1' });

    // Sort by value (highest first) - handle string values (storage)
    return values.sort((a, b) => {
      const aVal = typeof a.value === 'string' ? parseFloat(a.value) : a.value;
      const bVal = typeof b.value === 'string' ? parseFloat(b.value) : b.value;
      return bVal - aVal;
    });
  };

  return (
    <div className="growth-chart">
      <div className="growth-chart__header">
        <h2>📈 Growth Timeline</h2>
        <div className="growth-chart__toggles">
          <button
            className={`toggle ${visibleLines.loc ? 'active' : ''}`}
            onClick={() => toggleLine('loc')}
            style={{ borderColor: visibleLines.loc ? '#3b82f6' : 'var(--border-color)' }}
          >
            📝 LOC
          </button>
          <button
            className={`toggle ${visibleLines.users ? 'active' : ''}`}
            onClick={() => toggleLine('users')}
            style={{ borderColor: visibleLines.users ? '#8b5cf6' : 'var(--border-color)' }}
          >
            👥 Users
          </button>
          <button
            className={`toggle ${visibleLines.messages ? 'active' : ''}`}
            onClick={() => toggleLine('messages')}
            style={{ borderColor: visibleLines.messages ? '#06b6d4' : 'var(--border-color)' }}
          >
            💬 Messages
          </button>
          <button
            className={`toggle ${visibleLines.storage ? 'active' : ''}`}
            onClick={() => toggleLine('storage')}
            style={{ borderColor: visibleLines.storage ? '#f59e0b' : 'var(--border-color)' }}
          >
            💾 Storage
          </button>
          <button
            className={`toggle ${visibleLines.typescript ? 'active' : ''}`}
            onClick={() => toggleLine('typescript')}
            style={{ borderColor: visibleLines.typescript ? '#3178c6' : 'var(--border-color)' }}
          >
            📘 TS
          </button>
          <button
            className={`toggle ${visibleLines.javascript ? 'active' : ''}`}
            onClick={() => toggleLine('javascript')}
            style={{ borderColor: visibleLines.javascript ? '#f7df1e' : 'var(--border-color)' }}
          >
            📙 JS
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
            className={`toggle ${visibleLines.sql ? 'active' : ''}`}
            onClick={() => toggleLine('sql')}
            style={{ borderColor: visibleLines.sql ? '#00758f' : 'var(--border-color)' }}
          >
            🗄️ SQL
          </button>
          <button
            className={`toggle ${visibleLines.css ? 'active' : ''}`}
            onClick={() => toggleLine('css')}
            style={{ borderColor: visibleLines.css ? '#264de4' : 'var(--border-color)' }}
          >
            🎨 CSS
          </button>
          <button
            className={`toggle ${visibleLines.json ? 'active' : ''}`}
            onClick={() => toggleLine('json')}
            style={{ borderColor: visibleLines.json ? '#5a5a5a' : 'var(--border-color)' }}
          >
            📦 JSON
          </button>
          <button
            className={`toggle ${visibleLines.markdown ? 'active' : ''}`}
            onClick={() => toggleLine('markdown')}
            style={{ borderColor: visibleLines.markdown ? '#083fa1' : 'var(--border-color)' }}
          >
            📝 MD
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

          {visibleLines.loc && (
            <Line
              type="monotone"
              dataKey="loc"
              name="Lines of Code"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.users && (
            <Line
              type="monotone"
              dataKey="users"
              name="Users"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.messages && (
            <Line
              type="monotone"
              dataKey="messages"
              name="Messages"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.storage && (
            <Line
              type="monotone"
              dataKey="storage_mb"
              name="Storage (MB)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.typescript && (
            <Line
              type="monotone"
              dataKey="typescript"
              name="TypeScript LOC"
              stroke="#3178c6"
              strokeWidth={2}
              dot={{ fill: '#3178c6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.javascript && (
            <Line
              type="monotone"
              dataKey="javascript"
              name="JavaScript LOC"
              stroke="#f7df1e"
              strokeWidth={2}
              dot={{ fill: '#f7df1e', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.cpp && (
            <Line
              type="monotone"
              dataKey="cpp"
              name="C++ LOC"
              stroke="#659ad2"
              strokeWidth={2}
              dot={{ fill: '#659ad2', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.scss && (
            <Line
              type="monotone"
              dataKey="scss"
              name="SCSS LOC"
              stroke="#cc6699"
              strokeWidth={2}
              dot={{ fill: '#cc6699', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.sql && (
            <Line
              type="monotone"
              dataKey="sql"
              name="SQL LOC"
              stroke="#00758f"
              strokeWidth={2}
              dot={{ fill: '#00758f', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.css && (
            <Line
              type="monotone"
              dataKey="css"
              name="CSS LOC"
              stroke="#264de4"
              strokeWidth={2}
              dot={{ fill: '#264de4', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.json && (
            <Line
              type="monotone"
              dataKey="json"
              name="JSON LOC"
              stroke="#5a5a5a"
              strokeWidth={2}
              dot={{ fill: '#5a5a5a', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}

          {visibleLines.markdown && (
            <Line
              type="monotone"
              dataKey="markdown"
              name="Markdown LOC"
              stroke="#083fa1"
              strokeWidth={2}
              dot={{ fill: '#083fa1', r: 4 }}
              activeDot={{ r: 6 }}
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
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="growth-chart__note">
        {usingRealData ? (
          <>
            ✅ Using real snapshot data from <code>project_snapshots</code> table ({chartData.length}{' '}
            data points)
          </>
        ) : (
          <>
            ⚠️ No snapshots found. Create snapshots via "📸 Snapshot" button to see historical growth.
          </>
        )}
      </p>
    </div>
  );
}
