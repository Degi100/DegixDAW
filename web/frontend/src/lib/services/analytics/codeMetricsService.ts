/**
 * Code Metrics Service - Git-based Statistics
 *
 * Provides real-time code metrics from Git repository:
 * - Lines of Code (LOC) - Current and historical
 * - File count
 * - Commit count
 * - Project age
 *
 * Uses Node.js child_process to execute Git commands.
 * Results are cached to avoid expensive recalculations.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export interface CodeMetrics {
  loc: number;              // Total lines of code
  files: number;            // Total files tracked by Git
  commits: number;          // Total commit count
  projectAge: {
    days: number;
    startDate: string;      // ISO date of first commit
  };
}

export interface GitCommitStats {
  hash: string;
  date: string;             // ISO date
  message: string;
  additions: number;
  deletions: number;
  filesChanged: number;
}

// Cache for expensive operations
let cachedMetrics: CodeMetrics | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get current Lines of Code (LOC) from Git-tracked files
 * Counts lines in: .ts, .tsx, .js, .jsx, .css, .scss files
 * Uses Node.js fs for cross-platform compatibility
 */
async function getCurrentLOC(): Promise<number> {
  try {
    // Step 1: Get all Git-tracked files
    const { stdout: filesOutput } = await execAsync('git ls-files', { cwd: process.cwd() });
    const files = filesOutput.trim().split('\n').filter(Boolean);

    // Step 2: Filter for source files
    const sourceFiles = files.filter(f =>
      /\.(ts|tsx|js|jsx|css|scss)$/.test(f)
    );

    if (sourceFiles.length === 0) return 0;

    // Step 3: Count lines using Node.js (fast & cross-platform)
    const rootDir = process.cwd();
    let totalLines = 0;

    const lineCounts = await Promise.all(
      sourceFiles.map(async (file) => {
        try {
          const filePath = join(rootDir, file);
          const content = await readFile(filePath, 'utf-8');
          return content.split('\n').length;
        } catch {
          // File might not exist or be binary, skip
          return 0;
        }
      })
    );

    totalLines = lineCounts.reduce((sum, count) => sum + count, 0);

    return totalLines;
  } catch (error) {
    console.error('[CodeMetrics] Failed to count LOC:', error);
    return 0;
  }
}

/**
 * Get total file count from Git
 */
async function getFileCount(): Promise<number> {
  try {
    const { stdout } = await execAsync('git ls-files | wc -l', { cwd: process.cwd() });
    return parseInt(stdout.trim(), 10) || 0;
  } catch (error) {
    console.error('[CodeMetrics] Failed to count files:', error);
    return 0;
  }
}

/**
 * Get total commit count
 */
async function getCommitCount(): Promise<number> {
  try {
    const { stdout } = await execAsync('git rev-list --count HEAD', { cwd: process.cwd() });
    return parseInt(stdout.trim(), 10) || 0;
  } catch (error) {
    console.error('[CodeMetrics] Failed to count commits:', error);
    return 0;
  }
}

/**
 * Get project age and start date from first commit
 */
async function getProjectAge(): Promise<{ days: number; startDate: string }> {
  try {
    const { stdout } = await execAsync(
      'git log --reverse --format="%ai" | head -1',
      { cwd: process.cwd() }
    );

    const firstCommitDate = new Date(stdout.trim());
    const now = new Date();
    const diffMs = now.getTime() - firstCommitDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      days,
      startDate: firstCommitDate.toISOString().split('T')[0] // YYYY-MM-DD
    };
  } catch (error) {
    console.error('[CodeMetrics] Failed to get project age:', error);
    return { days: 0, startDate: new Date().toISOString().split('T')[0] };
  }
}

/**
 * Get all code metrics (with caching)
 */
export async function getCodeMetrics(): Promise<CodeMetrics> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedMetrics && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('[CodeMetrics] Returning cached metrics');
    return cachedMetrics;
  }

  console.log('[CodeMetrics] Fetching fresh metrics from Git...');

  try {
    const [loc, files, commits, projectAge] = await Promise.all([
      getCurrentLOC(),
      getFileCount(),
      getCommitCount(),
      getProjectAge()
    ]);

    cachedMetrics = {
      loc,
      files,
      commits,
      projectAge
    };

    cacheTimestamp = now;
    console.log('[CodeMetrics] Metrics cached successfully');

    return cachedMetrics;
  } catch (error) {
    console.error('[CodeMetrics] Failed to fetch metrics:', error);
    throw new Error('Failed to fetch code metrics from Git');
  }
}

/**
 * Get historical LOC data for specific commits
 * WARNING: Expensive operation! Only use for timeline charts.
 *
 * @param commitHashes Array of commit hashes to analyze
 * @returns Map of commit hash → LOC at that point
 */
export async function getHistoricalLOC(commitHashes: string[]): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  console.log(`[CodeMetrics] Fetching historical LOC for ${commitHashes.length} commits...`);

  for (const hash of commitHashes) {
    try {
      // Checkout commit (in detached HEAD state)
      await execAsync(`git checkout ${hash} --quiet`, { cwd: process.cwd() });

      // Count LOC at this point
      const loc = await getCurrentLOC();
      results.set(hash, loc);

      console.log(`[CodeMetrics] ${hash.substring(0, 7)}: ${loc} LOC`);
    } catch (error) {
      console.error(`[CodeMetrics] Failed to analyze commit ${hash}:`, error);
      results.set(hash, 0);
    }
  }

  // Return to current branch
  try {
    await execAsync('git checkout -', { cwd: process.cwd() });
  } catch (error) {
    console.error('[CodeMetrics] Failed to return to previous branch:', error);
  }

  return results;
}

/**
 * Get commit statistics (additions/deletions per commit)
 * Useful for milestone LOC changes
 *
 * @param limit Number of recent commits to fetch (default: 10)
 */
export async function getRecentCommitStats(limit: number = 10): Promise<GitCommitStats[]> {
  try {
    const { stdout } = await execAsync(
      `git log --pretty=format:"%H|%ai|%s" --numstat -n ${limit}`,
      { cwd: process.cwd() }
    );

    const lines = stdout.trim().split('\n');
    const commits: GitCommitStats[] = [];
    let currentCommit: Partial<GitCommitStats> | null = null;
    let additions = 0;
    let deletions = 0;
    let filesChanged = 0;

    for (const line of lines) {
      if (line.includes('|')) {
        // Save previous commit if exists
        if (currentCommit) {
          commits.push({
            ...currentCommit,
            additions,
            deletions,
            filesChanged
          } as GitCommitStats);
        }

        // Parse new commit header
        const [hash, date, message] = line.split('|');
        currentCommit = { hash, date, message };
        additions = 0;
        deletions = 0;
        filesChanged = 0;
      } else if (line.trim()) {
        // Parse numstat line: "additions deletions filename"
        const [add, del] = line.trim().split(/\s+/);
        if (add !== '-' && del !== '-') {
          additions += parseInt(add, 10) || 0;
          deletions += parseInt(del, 10) || 0;
          filesChanged++;
        }
      }
    }

    // Save last commit
    if (currentCommit) {
      commits.push({
        ...currentCommit,
        additions,
        deletions,
        filesChanged
      } as GitCommitStats);
    }

    return commits;
  } catch (error) {
    console.error('[CodeMetrics] Failed to get commit stats:', error);
    return [];
  }
}

/**
 * Manually clear cache (useful for testing)
 */
export function clearCache(): void {
  cachedMetrics = null;
  cacheTimestamp = 0;
  console.log('[CodeMetrics] Cache cleared');
}
