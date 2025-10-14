#!/usr/bin/env node
/**
 * Historical Snapshots Backfill Script
 *
 * Creates snapshots for the last 30 days based on actual Git history
 *
 * This script:
 * 1. Gets all commits from the last 30 days
 * 2. For each day, finds the last commit
 * 3. Checks out that commit
 * 4. Counts LOC per language AT THAT TIME
 * 5. Creates snapshot with correct date
 * 6. Returns to current branch
 *
 * Environment Variables Required:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 * node scripts/analytics/backfill-snapshots-history.js
 */

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '..', '.env.local');
dotenv.config({ path: envPath });
console.log(`📂 Loading env from: ${envPath}\n`);

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DAYS_TO_BACKFILL = 30; // Last 30 days

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log('✅ Supabase client initialized');

// ============================================================================
// Git Helper Functions
// ============================================================================

async function getCurrentBranch() {
  const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD');
  return stdout.trim();
}

async function getCommitForDate(date, projectRoot) {
  // Get the last commit before end of that day
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const dateString = endOfDay.toISOString();

  try {
    const { stdout } = await execAsync(
      `git rev-list -1 --before="${dateString}" --all`,
      { cwd: projectRoot }
    );
    return stdout.trim();
  } catch (error) {
    return null; // No commits on that day
  }
}

async function checkoutCommit(commitHash, projectRoot) {
  await execAsync(`git checkout ${commitHash} --quiet`, { cwd: projectRoot });
}

async function getFirstCommitDate(projectRoot) {
  const { stdout } = await execAsync(
    'git log --format=%ai --reverse',
    { cwd: projectRoot }
  );
  const firstCommitLine = stdout.trim().split('\n')[0];
  return new Date(firstCommitLine);
}

// ============================================================================
// Code Metrics Calculator (for a specific point in time)
// ============================================================================

async function getCodeMetricsForCommit(projectRoot) {
  try {
    // 1. Count files
    const { stdout: filesOutput } = await execAsync('git ls-files', { cwd: projectRoot });
    const allFiles = filesOutput.trim().split('\n').filter(Boolean);
    const sourceFiles = allFiles.filter((f) =>
      /\.(ts|tsx|js|jsx|cpp|h|css|scss|json|md|sql)$/.test(f)
    );
    const filesCount = sourceFiles.length;

    // 2. Count commits up to this point
    const { stdout: commitsOutput } = await execAsync('git rev-list --count HEAD', {
      cwd: projectRoot,
    });
    const commitsCount = parseInt(commitsOutput.trim(), 10);

    // 3. Count Lines of Code (LOC) with Language Breakdown
    let totalLOC = 0;
    const languageStats = {
      typescript: 0,
      javascript: 0,
      cpp: 0,
      scss: 0,
      css: 0,
      sql: 0,
      json: 0,
      markdown: 0,
    };

    for (const file of sourceFiles) {
      try {
        const filePath = path.join(projectRoot, file);
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        totalLOC += lines;

        // Categorize by language
        if (file.match(/\.(ts|tsx)$/)) languageStats.typescript += lines;
        else if (file.match(/\.(js|jsx)$/)) languageStats.javascript += lines;
        else if (file.match(/\.(cpp|h)$/)) languageStats.cpp += lines;
        else if (file.match(/\.scss$/)) languageStats.scss += lines;
        else if (file.match(/\.css$/)) languageStats.css += lines;
        else if (file.match(/\.sql$/)) languageStats.sql += lines;
        else if (file.match(/\.json$/)) languageStats.json += lines;
        else if (file.match(/\.md$/)) languageStats.markdown += lines;
      } catch (err) {
        // Skip files that can't be read
        // (might be binary or deleted in detached state)
      }
    }

    return {
      loc: totalLOC,
      files: filesCount,
      commits: commitsCount,
      languageStats,
    };
  } catch (error) {
    console.error(`   ⚠️  Error calculating metrics: ${error.message}`);
    return null;
  }
}

// ============================================================================
// Snapshot Creator
// ============================================================================

async function createSnapshotForDate(date, code, projectRoot) {
  const snapshotDate = date.toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if snapshot already exists
  const { data: existing } = await supabase
    .from('project_snapshots')
    .select('id')
    .eq('snapshot_date', snapshotDate)
    .single();

  if (existing) {
    console.log(`   ⏭️  Snapshot already exists for ${snapshotDate}, skipping`);
    return false;
  }

  // Build snapshot object
  const snapshot = {
    snapshot_date: snapshotDate,

    // Code Metrics
    total_loc: code.loc,
    total_files: code.files,
    total_commits: code.commits,

    // Language Breakdown
    typescript_loc: code.languageStats.typescript,
    javascript_loc: code.languageStats.javascript,
    cpp_loc: code.languageStats.cpp,
    scss_loc: code.languageStats.scss,
    css_loc: code.languageStats.css,
    sql_loc: code.languageStats.sql,
    json_loc: code.languageStats.json,
    markdown_loc: code.languageStats.markdown,

    // User/Message/Issue Metrics (0 for historical data - no Supabase history)
    total_users: 0,
    active_users: 0,
    total_messages: 0,
    total_conversations: 0,
    total_issues: 0,
    open_issues: 0,
    closed_issues: 0,
    in_progress_issues: 0,

    // Storage Metrics (0 for historical data)
    database_size_mb: 0,
    storage_size_mb: 0,
    total_storage_mb: 0,

    // Metadata
    created_by: null,
    metadata: {
      created_via: 'backfill_script',
      backfilled: true,
      original_commit_count: code.commits,
    },
  };

  // Insert into database
  const { error } = await supabase
    .from('project_snapshots')
    .insert(snapshot);

  if (error) {
    console.error(`   ❌ Error inserting snapshot: ${error.message}`);
    return false;
  }

  console.log(`   ✅ Created snapshot: ${snapshotDate} (${code.loc.toLocaleString()} LOC)`);
  return true;
}

// ============================================================================
// Main Backfill Logic
// ============================================================================

async function backfillSnapshots() {
  console.log('🚀 Historical Snapshots Backfill');
  console.log('='.repeat(60));
  console.log(`📅 Backfilling last ${DAYS_TO_BACKFILL} days\n`);

  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const originalBranch = await getCurrentBranch();
  console.log(`📍 Current branch: ${originalBranch}`);

  // Get first commit date to avoid going before project start
  const firstCommitDate = await getFirstCommitDate(projectRoot);
  console.log(`📅 Project started: ${firstCommitDate.toISOString().split('T')[0]}`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Generate dates for last N days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = DAYS_TO_BACKFILL - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip dates before project started
      if (date < firstCommitDate) {
        console.log(`⏭️  Skipping ${date.toISOString().split('T')[0]} (before project start)`);
        skipped++;
        continue;
      }

      const dateString = date.toISOString().split('T')[0];
      console.log(`\n📊 Processing ${dateString}...`);

      // Find commit for this date
      const commitHash = await getCommitForDate(date, projectRoot);

      if (!commitHash) {
        console.log(`   ⏭️  No commits on ${dateString}, skipping`);
        skipped++;
        continue;
      }

      console.log(`   📌 Commit: ${commitHash.substring(0, 7)}`);

      // Checkout to that commit
      await checkoutCommit(commitHash, projectRoot);

      // Calculate metrics at that point in time
      const code = await getCodeMetricsForCommit(projectRoot);

      if (!code) {
        console.log(`   ❌ Failed to calculate metrics`);
        errors++;
        continue;
      }

      console.log(`   📝 LOC: ${code.loc.toLocaleString()} (TS: ${code.languageStats.typescript}, JS: ${code.languageStats.javascript}, C++: ${code.languageStats.cpp})`);

      // Create snapshot
      const success = await createSnapshotForDate(date, code, projectRoot);
      if (success) {
        created++;
      } else {
        skipped++;
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } finally {
    // Always return to original branch
    console.log(`\n🔙 Returning to ${originalBranch}...`);
    await execAsync(`git checkout ${originalBranch} --quiet`, { cwd: projectRoot });
    console.log('✅ Back on original branch');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Backfill Summary:');
  console.log(`   ✅ Created:  ${created} snapshots`);
  console.log(`   ⏭️  Skipped:  ${skipped} days`);
  console.log(`   ❌ Errors:   ${errors} failures`);
  console.log('='.repeat(60));

  if (created > 0) {
    console.log('\n🎉 SUCCESS! Historical data backfilled!');
    console.log('   View your charts at Admin Analytics page.');
  }
}

// ============================================================================
// Entry Point
// ============================================================================

async function main() {
  try {
    await backfillSnapshots();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
