/**
 * useCodeGrowth Hook
 *
 * Manages state and logic for CodeGrowthChart:
 * - Data loading from snapshots
 * - Time range filtering
 * - Milestone detection
 * - Line visibility toggles
 */

import { useState, useEffect } from 'react';
import { getSnapshots } from '../lib/services/analytics/snapshotsService';

export interface CodeDataPoint {
  date: string;
  rawDate?: Date;
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
  breakdown?: any;
}

export interface Milestone {
  date: string;
  loc: number;
  type: 'threshold' | 'big_jump' | 'first_cpp' | 'special';
  label: string;
  emoji: string;
}

export type TimeRange = '3d' | '7d' | '14d' | '1m' | '3m' | '6m' | '1y' | 'all';

export interface VisibleLines {
  total: boolean;
  typescript: boolean;
  javascript: boolean;
  cpp: boolean;
  scss: boolean;
  css: boolean;
  sql: boolean;
  json: boolean;
  markdown: boolean;
  other: boolean;
}

export function useCodeGrowth() {
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({
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
  const [allData, setAllData] = useState<CodeDataPoint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [usingRealData, setUsingRealData] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Load historical snapshots from database
  useEffect(() => {
    loadSnapshotData();
  }, []);

  const loadSnapshotData = async () => {
    try {
      console.log('[useCodeGrowth] Loading snapshots...');
      const snapshots = await getSnapshots(365);

      if (snapshots.length > 0) {
        const data = snapshots
          .reverse()
          .map((snapshot) => ({
            date: new Date(snapshot.snapshot_date).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'short'
            }),
            rawDate: new Date(snapshot.snapshot_date),
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
            breakdown: (snapshot as any).breakdown
          }));

        setAllData(data);
        setChartData(data);
        setMilestones(detectMilestones(data));
        setUsingRealData(true);
        console.log(`[useCodeGrowth] ✅ Loaded ${snapshots.length} snapshots`);
      } else {
        console.warn('[useCodeGrowth] No snapshots found');
        setAllData([]);
        setChartData([]);
        setUsingRealData(false);
      }
    } catch (error) {
      console.error('[useCodeGrowth] Failed to load snapshots:', error);
      setAllData([]);
      setChartData([]);
      setUsingRealData(false);
    }
  };

  const toggleLine = (key: keyof VisibleLines) => {
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
  const detectMilestones = (data: CodeDataPoint[]): Milestone[] => {
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

    return values.sort((a, b) => b.value - a.value);
  };

  return {
    visibleLines,
    chartData,
    milestones,
    usingRealData,
    timeRange,
    setTimeRange,
    toggleLine,
    getCurrentValues
  };
}
