#!/usr/bin/env node
/**
 * Standalone Snapshot Creator for GitHub Actions
 *
 * Creates daily analytics snapshots with FULL metrics including code stats
 * Runs independently without browser or API server
 *
 * Environment Variables Required:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - GITHUB_TOKEN (optional, auto-provided by GitHub Actions)
 *
 * Usage:
 * node scripts/analytics/create-snapshot-github-actions.js
 */

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log('✅ Supabase client initialized');

// ============================================================================
// Get Code Metrics (LOC, Files, Commits, Languages)
// ============================================================================

async function getCodeMetrics() {
  console.log('📊 Calculating code metrics...');

  try {
    // After monorepo migration: scripts are in web/frontend/scripts/analytics
    // Need to go up 4 levels to reach repo root
    const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');

    // 1. Count files
    const { stdout: filesOutput } = await execAsync('git ls-files', { cwd: projectRoot });
    const allFiles = filesOutput.trim().split('\n').filter(Boolean);
    const sourceFiles = allFiles.filter((f) =>
      /\.(ts|tsx|js|jsx|cpp|h|css|scss|json|md|sql|yml|yaml|toml|txt|bat|sh|html|xml)$/.test(f)
    );
    const filesCount = sourceFiles.length;

    // 2. Count commits
    const { stdout: commitsOutput } = await execAsync('git rev-list --count HEAD', {
      cwd: projectRoot,
    });
    const commitsCount = parseInt(commitsOutput.trim(), 10);

    // 3. Get first commit date (project age)
    const { stdout: firstCommitOutput } = await execAsync(
      'git log --format=%ai --reverse',
      { cwd: projectRoot }
    );
    const firstCommitLine = firstCommitOutput.trim().split('\n')[0];
    const firstCommitDate = new Date(firstCommitLine);
    const startDate = firstCommitDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const projectAgeDays = Math.floor((Date.now() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24));

    // 4. Count Lines of Code (LOC) with Language Breakdown + Detailed Breakdown
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
      other: 0,
    };

    // Detailed breakdown for tooltips
    const breakdown = {
      typescript: { frontend: 0, backend: 0, packages: 0, desktop: 0 },
      javascript: { frontend: 0, backend: 0, packages: 0, desktop: 0 },
      cpp: { files: 0, loc: 0 },
      scss: { files: 0, loc: 0 },
      css: { files: 0, loc: 0 },
      sql: { files: 0, loc: 0 },
      json: { packageLock: 0, configs: 0, other: 0, files: 0 },
      markdown: { readme: 0, docs: 0, other: 0, files: 0 },
      other: { yml: 0, toml: 0, bat: 0, sh: 0, html: 0, xml: 0, txt: 0, files: 0 }
    };

    for (const file of sourceFiles) {
      try {
        const filePath = path.join(projectRoot, file);
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        totalLOC += lines;

        // Categorize by language with detailed breakdown
        if (file.match(/\.(ts|tsx)$/)) {
          languageStats.typescript += lines;
          if (file.startsWith('web/frontend/')) breakdown.typescript.frontend += lines;
          else if (file.startsWith('web/backend/')) breakdown.typescript.backend += lines;
          else if (file.startsWith('packages/')) breakdown.typescript.packages += lines;
          else if (file.startsWith('desktop/')) breakdown.typescript.desktop += lines;
        }
        else if (file.match(/\.(js|jsx)$/)) {
          languageStats.javascript += lines;
          if (file.startsWith('web/frontend/')) breakdown.javascript.frontend += lines;
          else if (file.startsWith('web/backend/')) breakdown.javascript.backend += lines;
          else if (file.startsWith('packages/')) breakdown.javascript.packages += lines;
          else if (file.startsWith('desktop/')) breakdown.javascript.desktop += lines;
        }
        else if (file.match(/\.(cpp|h)$/)) {
          languageStats.cpp += lines;
          breakdown.cpp.files++;
          breakdown.cpp.loc += lines;
        }
        else if (file.match(/\.scss$/)) {
          languageStats.scss += lines;
          breakdown.scss.files++;
          breakdown.scss.loc += lines;
        }
        else if (file.match(/\.css$/)) {
          languageStats.css += lines;
          breakdown.css.files++;
          breakdown.css.loc += lines;
        }
        else if (file.match(/\.sql$/)) {
          languageStats.sql += lines;
          breakdown.sql.files++;
          breakdown.sql.loc += lines;
        }
        else if (file.match(/\.json$/)) {
          languageStats.json += lines;
          breakdown.json.files++;
          if (file.includes('package-lock.json')) breakdown.json.packageLock += lines;
          else if (file.match(/(tsconfig|package|vite\.config|eslint)\.json/)) breakdown.json.configs += lines;
          else breakdown.json.other += lines;
        }
        else if (file.match(/\.md$/)) {
          languageStats.markdown += lines;
          breakdown.markdown.files++;
          if (file.match(/README\.md$/i)) breakdown.markdown.readme += lines;
          else if (file.match(/CLAUDE\.md$/i)) breakdown.markdown.docs += lines;
          else breakdown.markdown.other += lines;
        }
        else {
          languageStats.other += lines;
          breakdown.other.files++;
          if (file.match(/\.(yml|yaml)$/)) breakdown.other.yml += lines;
          else if (file.match(/\.toml$/)) breakdown.other.toml += lines;
          else if (file.match(/\.bat$/)) breakdown.other.bat += lines;
          else if (file.match(/\.sh$/)) breakdown.other.sh += lines;
          else if (file.match(/\.html$/)) breakdown.other.html += lines;
          else if (file.match(/\.xml$/)) breakdown.other.xml += lines;
          else if (file.match(/\.txt$/)) breakdown.other.txt += lines;
        }
      } catch (err) {
        // Skip files that can't be read
        console.warn(`   ⚠️  Skipping ${file}: ${err.message}`);
      }
    }

    console.log(`   ✅ Total LOC: ${totalLOC.toLocaleString()}`);
    console.log(`   ✅ Files: ${filesCount}`);
    console.log(`   ✅ Commits: ${commitsCount}`);
    console.log(`   ✅ Age: ${projectAgeDays} days (since ${startDate})`);
    console.log(`   📊 Languages: TS=${languageStats.typescript} | JS=${languageStats.javascript} | C++=${languageStats.cpp} | SCSS=${languageStats.scss} | SQL=${languageStats.sql}`);

    return {
      loc: totalLOC,
      files: filesCount,
      commits: commitsCount,
      projectAge: {
        days: projectAgeDays,
        startDate,
      },
      languageStats,
      breakdown, // Detailed breakdown for tooltips
    };
  } catch (error) {
    console.error('❌ Error calculating code metrics:', error.message);
    throw error;
  }
}

// ============================================================================
// Get Project Metrics (Users, Messages, Issues)
// ============================================================================

async function getProjectMetrics() {
  console.log('📊 Fetching project metrics...');

  try {
    // Users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { data: conversations } = await supabase
      .from('messages')
      .select('conversation_id');

    const uniqueConversations = new Set(conversations?.map(m => m.conversation_id) || []).size;

    // Issues
    const { count: totalIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true });

    const { count: openIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: closedIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'closed');

    const { count: inProgressIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    console.log(`   ✅ Users: ${totalUsers} (${activeUsers} active)`);
    console.log(`   ✅ Messages: ${totalMessages} (${uniqueConversations} conversations)`);
    console.log(`   ✅ Issues: ${totalIssues} (${openIssues} open, ${inProgressIssues} in progress, ${closedIssues} closed)`);

    return {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
      },
      messages: {
        total: totalMessages || 0,
        conversations: uniqueConversations || 0,
      },
      issues: {
        total: totalIssues || 0,
        open: openIssues || 0,
        closed: closedIssues || 0,
        in_progress: inProgressIssues || 0,
      },
    };
  } catch (error) {
    console.error('❌ Error fetching project metrics:', error.message);
    throw error;
  }
}

// ============================================================================
// Get Storage Stats (Database Size)
// ============================================================================

async function getStorageStats() {
  console.log('📊 Calculating storage stats...');

  try {
    // Query database size via Supabase RPC wrapper
    const { data, error } = await supabase.rpc('get_database_size');

    if (error) {
      console.warn('   ⚠️  Could not fetch DB size:', error.message);
      console.warn('   ⚠️  Using estimate (0 MB)');
    }

    const databaseSizeMB = data ? (data / (1024 * 1024)).toFixed(2) : 0;
    const storageSizeMB = 0; // Would require Supabase Storage API

    console.log(`   ✅ Database: ${databaseSizeMB} MB`);
    console.log(`   ✅ Storage: ${storageSizeMB} MB`);

    return {
      database: {
        total_mb: parseFloat(databaseSizeMB),
      },
      storage: {
        total_mb: parseFloat(storageSizeMB),
      },
      total_mb: parseFloat(databaseSizeMB) + parseFloat(storageSizeMB),
    };
  } catch (error) {
    console.warn('   ⚠️  Error calculating storage stats, using defaults:', error.message);
    return {
      database: { total_mb: 0 },
      storage: { total_mb: 0 },
      total_mb: 0,
    };
  }
}

// ============================================================================
// Create Snapshot
// ============================================================================

async function createSnapshot() {
  const snapshotDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`\n🔄 Creating snapshot for ${snapshotDate}...`);

  try {
    // Check if snapshot already exists for today
    const { data: existing } = await supabase
      .from('project_snapshots')
      .select('id')
      .eq('snapshot_date', snapshotDate)
      .single();

    if (existing) {
      console.log('⚠️  Snapshot already exists for today!');
      console.log(`   ID: ${existing.id}`);
      return existing;
    }

    // Fetch all metrics
    const [code, metrics, storage] = await Promise.all([
      getCodeMetrics(),
      getProjectMetrics(),
      getStorageStats(),
    ]);

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
      other_loc: code.languageStats.other,

      // User Metrics
      total_users: metrics.users.total,
      active_users: metrics.users.active,

      // Message Metrics
      total_messages: metrics.messages.total,
      total_conversations: metrics.messages.conversations,

      // Issue Metrics
      total_issues: metrics.issues.total,
      open_issues: metrics.issues.open,
      closed_issues: metrics.issues.closed,
      in_progress_issues: metrics.issues.in_progress,

      // Storage Metrics
      database_size_mb: storage.database.total_mb,
      storage_size_mb: storage.storage.total_mb,
      total_storage_mb: storage.total_mb,

      // Detailed Breakdown (for tooltips)
      breakdown: code.breakdown,

      // Metadata
      created_by: null, // GitHub Actions has no user context
      metadata: {
        created_via: 'github_actions',
        project_age_days: code.projectAge.days,
        workflow: process.env.GITHUB_WORKFLOW || 'local',
        run_id: process.env.GITHUB_RUN_ID || null,
      },
    };

    // Insert into database
    const { data, error } = await supabase
      .from('project_snapshots')
      .insert(snapshot)
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting snapshot:', error);
      throw error;
    }

    console.log('\n✅ Snapshot created successfully!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Date: ${data.snapshot_date}`);
    console.log(`   LOC: ${data.total_loc.toLocaleString()}`);
    console.log(`   Users: ${data.total_users}`);
    console.log(`   Messages: ${data.total_messages}`);
    console.log(`   Issues: ${data.total_issues}`);

    return data;
  } catch (error) {
    console.error('❌ Error creating snapshot:', error.message);
    throw error;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🚀 Daily Snapshot Creator - GitHub Actions Edition');
  console.log('================================================\n');

  try {
    const snapshot = await createSnapshot();
    console.log('\n🎉 Success! Snapshot created.');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Failed to create snapshot:', error.message);
    process.exit(1);
  }
}

main();
