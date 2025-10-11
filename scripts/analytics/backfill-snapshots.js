/**
 * Backfill Historical Snapshots
 *
 * Creates project snapshots for each day since project start
 * Uses Git history to calculate realistic LOC/Files/Commits growth
 *
 * Usage:
 *   npm run analytics:backfill
 */

// Load environment variables first
import './load-env.js';

import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.error('   You can find it in: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================================
// Git Analysis Functions
// ============================================================================

/**
 * Get all commit dates since project start
 */
async function getCommitDates() {
  const { stdout } = await execAsync('git log --format=%ai --reverse', { cwd: projectRoot });
  const dates = stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => new Date(line));

  return dates;
}

/**
 * Get LOC and Files count at a specific date
 */
async function getStatsAtDate(date) {
  const dateStr = date.toISOString().split('T')[0];

  try {
    // Find the commit hash at or before this date
    const { stdout: hashOutput } = await execAsync(
      `git rev-list -1 --before="${dateStr} 23:59:59" HEAD`,
      { cwd: projectRoot }
    );

    const commitHash = hashOutput.trim();
    if (!commitHash) {
      return { loc: 0, files: 0, commits: 0 };
    }

    // Count commits up to this date
    const { stdout: commitsOutput } = await execAsync(
      `git rev-list --count ${commitHash}`,
      { cwd: projectRoot }
    );
    const commits = parseInt(commitsOutput.trim(), 10);

    // Get files at this commit
    const { stdout: filesOutput } = await execAsync(`git ls-tree -r ${commitHash} --name-only`, {
      cwd: projectRoot
    });

    const sourceFiles = filesOutput
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((f) => /\.(ts|tsx|js|jsx|css|scss|json|md|sql)$/.test(f));

    const filesCount = sourceFiles.length;

    // Count LOC at this commit WITH LANGUAGE BREAKDOWN
    let totalLOC = 0;
    const languageStats = {
      typescript: 0,
      javascript: 0,
      scss: 0,
      css: 0,
      sql: 0,
      json: 0,
      markdown: 0
    };

    for (const file of sourceFiles) {
      try {
        const { stdout: fileContent } = await execAsync(
          `git show ${commitHash}:${file}`,
          { cwd: projectRoot }
        );
        const loc = fileContent.split('\n').length;
        totalLOC += loc;

        // Categorize by language
        if (file.match(/\.(ts|tsx)$/)) languageStats.typescript += loc;
        else if (file.match(/\.(js|jsx)$/)) languageStats.javascript += loc;
        else if (file.match(/\.scss$/)) languageStats.scss += loc;
        else if (file.match(/\.css$/)) languageStats.css += loc;
        else if (file.match(/\.sql$/)) languageStats.sql += loc;
        else if (file.match(/\.json$/)) languageStats.json += loc;
        else if (file.match(/\.md$/)) languageStats.markdown += loc;
      } catch (err) {
        // File might not exist at this commit, skip
        continue;
      }
    }

    return { loc: totalLOC, files: filesCount, commits, languageStats };
  } catch (error) {
    console.warn(`⚠️  Could not get stats for ${dateStr}:`, error.message);
    return { loc: 0, files: 0, commits: 0 };
  }
}

/**
 * Simulate user/message/issue growth based on day progress
 */
function simulateMetrics(dayIndex, totalDays, finalMetrics) {
  const progress = dayIndex / totalDays;

  // Exponential growth curve with some randomness
  const growthFactor = Math.pow(progress, 0.8); // Slower at start, faster at end
  const variance = (Math.random() - 0.5) * 0.1; // ±5%

  return {
    users: Math.max(1, Math.floor(finalMetrics.users * (growthFactor + variance))),
    activeUsers: Math.max(1, Math.floor(finalMetrics.activeUsers * (growthFactor + variance))),
    messages: Math.max(0, Math.floor(finalMetrics.messages * (growthFactor + variance))),
    conversations: Math.max(0, Math.floor(finalMetrics.conversations * (growthFactor + variance))),
    issues: Math.max(0, Math.floor(finalMetrics.issues * (growthFactor + variance))),
    openIssues: Math.max(0, Math.floor(finalMetrics.openIssues * (growthFactor + variance))),
    closedIssues: Math.max(0, Math.floor(finalMetrics.closedIssues * (growthFactor + variance))),
    inProgressIssues: Math.max(
      0,
      Math.floor(finalMetrics.inProgressIssues * (growthFactor + variance))
    )
  };
}

// ============================================================================
// Snapshot Creation
// ============================================================================

/**
 * Create a snapshot for a specific date
 */
async function createSnapshot(date, metrics) {
  const snapshotDate = date.toISOString().split('T')[0];

  const snapshot = {
    snapshot_date: snapshotDate,
    total_loc: metrics.loc,
    total_files: metrics.files,
    total_commits: metrics.commits,
    // Language Breakdown
    typescript_loc: metrics.languageStats?.typescript || 0,
    javascript_loc: metrics.languageStats?.javascript || 0,
    scss_loc: metrics.languageStats?.scss || 0,
    css_loc: metrics.languageStats?.css || 0,
    sql_loc: metrics.languageStats?.sql || 0,
    json_loc: metrics.languageStats?.json || 0,
    markdown_loc: metrics.languageStats?.markdown || 0,
    // User/Message/Issue Metrics
    total_users: metrics.users,
    active_users: metrics.activeUsers,
    total_messages: metrics.messages,
    total_conversations: metrics.conversations,
    total_issues: metrics.issues,
    open_issues: metrics.openIssues,
    closed_issues: metrics.closedIssues,
    in_progress_issues: metrics.inProgressIssues,
    // Storage Metrics
    database_size_mb: metrics.storageMb * 0.9, // 90% DB
    storage_size_mb: metrics.storageMb * 0.1, // 10% Files
    total_storage_mb: metrics.storageMb,
    metadata: { created_via: 'backfill_script', project_day: metrics.dayIndex }
  };

  const { data, error } = await supabase
    .from('project_snapshots')
    .upsert(snapshot, { onConflict: 'snapshot_date' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create snapshot for ${snapshotDate}: ${error.message}`);
  }

  return data;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('📊 Backfilling Historical Snapshots...\n');

  // 1. Get commit history
  console.log('🔍 Analyzing Git history...');
  const commitDates = await getCommitDates();
  const firstCommit = commitDates[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate total days since project start
  const totalDays = Math.ceil((today - firstCommit) / (1000 * 60 * 60 * 24));

  console.log(`📅 Project Start: ${firstCommit.toISOString().split('T')[0]}`);
  console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);
  console.log(`📊 Total Days: ${totalDays}\n`);

  // 2. Get current final metrics (for simulation)
  console.log('📈 Fetching current metrics for simulation...');
  const { data: profiles } = await supabase.from('profiles').select('id');
  const { count: messagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });
  const { count: conversationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });
  const { data: issues } = await supabase.from('issues').select('status');

  const finalMetrics = {
    users: profiles?.length || 3,
    activeUsers: Math.max(1, Math.floor((profiles?.length || 3) * 0.6)),
    messages: messagesCount || 100,
    conversations: conversationsCount || 20,
    issues: issues?.length || 10,
    openIssues: issues?.filter((i) => i.status === 'open').length || 3,
    closedIssues: issues?.filter((i) => i.status === 'closed').length || 5,
    inProgressIssues: issues?.filter((i) => i.status === 'in_progress').length || 2
  };

  console.log('Current Metrics:', finalMetrics);
  console.log('');

  // 3. Create snapshots for each day
  console.log('🚀 Creating snapshots...\n');
  const snapshots = [];

  for (let dayIndex = 0; dayIndex <= totalDays; dayIndex++) {
    const date = new Date(firstCommit);
    date.setDate(date.getDate() + dayIndex);

    // Get Git stats for this date
    console.log(`📸 Day ${dayIndex + 1}/${totalDays + 1}: ${date.toISOString().split('T')[0]}`);
    const gitStats = await getStatsAtDate(date);

    // Simulate other metrics
    const simulated = simulateMetrics(dayIndex, totalDays, finalMetrics);

    // Estimate storage based on LOC
    const storageMb = Math.max(1, (gitStats.loc / 5000) * 1.0); // ~1MB per 5000 LOC

    const metrics = {
      ...gitStats,
      ...simulated,
      storageMb,
      dayIndex
    };

    // Create snapshot
    const snapshot = await createSnapshot(date, metrics);
    snapshots.push(snapshot);

    const langs = gitStats.languageStats || {};
    console.log(
      `   ✅ Total: ${gitStats.loc.toLocaleString()} LOC, ${gitStats.files} Files, ${gitStats.commits} Commits`
    );
    console.log(
      `      📊 TS: ${langs.typescript || 0} | JS: ${langs.javascript || 0} | SCSS: ${langs.scss || 0} | SQL: ${langs.sql || 0} | MD: ${langs.markdown || 0}`
    );
  }

  console.log(`\n✅ Successfully created ${snapshots.length} snapshots!`);
  console.log('📊 GrowthChart should now show full historical timeline.');
}

// ============================================================================
// Run
// ============================================================================

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
