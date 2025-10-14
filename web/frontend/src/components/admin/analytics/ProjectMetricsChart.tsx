/**
 * ProjectMetricsChart Component
 *
 * Shows project activity and usage over time
 * Metrics: Users, Messages, Storage, Issues
 *
 * Uses real historical data from project_snapshots table
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSnapshots } from '../../../lib/services/analytics/snapshotsService';
import '../../../styles/components/analytics/GrowthChart.scss';

interface MetricsDataPoint {
  date: string;
  users: number;
  messages: number;
  storage_mb: number;
  issues: number;
}

export function ProjectMetricsChart() {
  const [visibleLines, setVisibleLines] = useState({
    users: true,
    messages: true,
    storage: false,
    issues: false
  });

  const [chartData, setChartData] = useState<MetricsDataPoint[]>([]);
  const [usingRealData, setUsingRealData] = useState(false);

  // Load historical snapshots from database
  useEffect(() => {
    loadSnapshotData();
  }, []);

  const loadSnapshotData = async () => {
    try {
      console.log('[ProjectMetricsChart] Loading snapshots...');
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
            users: snapshot.total_users || 0,
            messages: snapshot.total_messages || 0,
            storage_mb: snapshot.total_storage_mb || 0,
            issues: snapshot.total_issues || 0
          }));

        setChartData(data);
        setUsingRealData(true);
        console.log(`[ProjectMetricsChart] ✅ Loaded ${snapshots.length} snapshots`);
      } else {
        // No snapshots found - show empty chart
        console.warn('[ProjectMetricsChart] No snapshots found');
        setChartData([]);
        setUsingRealData(false);
      }
    } catch (error) {
      console.error('[ProjectMetricsChart] Failed to load snapshots:', error);
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

    if (visibleLines.users) values.push({ label: 'Users', value: lastPoint.users, color: '#8b5cf6' });
    if (visibleLines.messages) values.push({ label: 'Messages', value: lastPoint.messages, color: '#06b6d4' });
    if (visibleLines.storage) values.push({ label: 'Storage', value: `${lastPoint.storage_mb.toFixed(1)} MB`, color: '#f59e0b' });
    if (visibleLines.issues) values.push({ label: 'Issues', value: lastPoint.issues, color: '#ef4444' });

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
        <h2>📊 Project Activity</h2>
        <div className="growth-chart__toggles">
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
            className={`toggle ${visibleLines.issues ? 'active' : ''}`}
            onClick={() => toggleLine('issues')}
            style={{ borderColor: visibleLines.issues ? '#ef4444' : 'var(--border-color)' }}
          >
            🐛 Issues
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

          {visibleLines.users && (
            <Line
              type="monotone"
              dataKey="users"
              name="Users"
              stroke="#8b5cf6"
              strokeWidth={3}
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
              dot={{ fill: '#06b6d4', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.storage && (
            <Line
              type="monotone"
              dataKey="storage_mb"
              name="Storage (MB)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {visibleLines.issues && (
            <Line
              type="monotone"
              dataKey="issues"
              name="Issues"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 3 }}
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
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
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
