/**
 * Code Metrics Service - Browser Version
 *
 * Frontend wrapper that calls backend API for Git-based stats
 * Backend API: GET /api/analytics/code-metrics
 */

export interface CodeMetrics {
  loc: number;
  files: number;
  commits: number;
  projectAge: {
    days: number;
    startDate: string;
  };
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

/**
 * Get code metrics from backend API
 */
export async function getCodeMetrics(): Promise<CodeMetrics> {
  try {
    const response = await fetch(`${API_BASE}/api/analytics/code-metrics`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CodeMetrics] Failed to fetch from API:', error);

    // Fallback to dummy data (for now)
    return {
      loc: 46721,
      files: 435,
      commits: 234,
      projectAge: {
        days: 16,
        startDate: '2025-09-24'
      }
    };
  }
}
