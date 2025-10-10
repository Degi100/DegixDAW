/**
 * GrowthChart Component
 *
 * Multi-line chart showing project growth over time
 * Toggleable metrics: LOC, Users, Messages, Storage
 *
 * NOTE: For MVP, shows mock historical data
 * Future: Connect to project_snapshots table
 */

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProjectMetrics, StorageStats } from '../../../lib/services/analytics/types';
import './GrowthChart.scss';

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
}

export function GrowthChart({ metrics, storage }: GrowthChartProps) {
  const [visibleLines, setVisibleLines] = useState({
    loc: true,
    users: true,
    messages: false,
    storage: false
  });

  // Mock historical data (last 30 days)
  // TODO: Replace with real data from project_snapshots table
  const generateMockData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    const daysSinceStart = metrics.code.projectAge.days;

    // Generate data points (one per day for last 30 days, or project age if less)
    const daysToShow = Math.min(30, daysSinceStart);

    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simulate growth (exponential curve with some variance)
      const progress = 1 - (i / daysToShow);
      const variance = Math.random() * 0.1 - 0.05; // ±5% variance

      data.push({
        date: date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
        loc: Math.floor(metrics.code.loc * (progress + variance)),
        users: Math.floor(metrics.users.total * (progress + variance)),
        messages: Math.floor(metrics.messages.total * (progress + variance)),
        storage_mb: storage.total_mb * (progress + variance)
      });
    }

    return data;
  };

  const data = generateMockData();

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
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
        </LineChart>
      </ResponsiveContainer>

      <p className="growth-chart__note">
        💡 Note: Historical data is simulated. Connect to <code>project_snapshots</code> table for real data.
      </p>
    </div>
  );
}
