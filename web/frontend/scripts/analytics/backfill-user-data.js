#!/usr/bin/env node
/**
 * User Data Backfill Script
 *
 * Updates existing snapshots with historical user/message/issue counts
 * based on Supabase created_at timestamps
 *
 * This script:
 * 1. Gets all existing snapshots from database
 * 2. For each snapshot date:
 *    - Counts users created BEFORE that date
 *    - Counts messages created BEFORE that date
 *    - Counts issues created BEFORE that date
 * 3. Updates snapshot with real historical counts
 *
 * Environment Variables Required:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 * node scripts/analytics/backfill-user-data.js
 */

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '..', '.env.local');
dotenv.config({ path: envPath });
console.log(`📂 Loading env from: ${envPath}\n`);

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
// Data Counters (Historical)
// ============================================================================

async function countUsersUntilDate(date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const dateString = endOfDay.toISOString();

  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', dateString);

  if (error) {
    console.error(`   ⚠️  Error counting users: ${error.message}`);
    return 0;
  }

  return count || 0;
}

async function countMessagesUntilDate(date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const dateString = endOfDay.toISOString();

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', dateString);

  if (error) {
    console.error(`   ⚠️  Error counting messages: ${error.message}`);
    return 0;
  }

  return count || 0;
}

async function countIssuesUntilDate(date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const dateString = endOfDay.toISOString();

  // Total issues
  const { count: total, error: totalError } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', dateString);

  if (totalError) {
    console.error(`   ⚠️  Error counting issues: ${totalError.message}`);
    return { total: 0, open: 0, closed: 0, in_progress: 0 };
  }

  // Open issues (created before date AND still open)
  const { count: open } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', dateString)
    .eq('status', 'open');

  // Closed issues (created before date AND closed before date)
  const { count: closed } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', dateString)
    .eq('status', 'closed')
    .lte('closed_at', dateString);

  // In progress issues
  const { count: in_progress } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', dateString)
    .eq('status', 'in_progress');

  return {
    total: total || 0,
    open: open || 0,
    closed: closed || 0,
    in_progress: in_progress || 0
  };
}

async function countConversationsUntilDate(date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  const dateString = endOfDay.toISOString();

  const { count, error } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', dateString);

  if (error) {
    console.error(`   ⚠️  Error counting conversations: ${error.message}`);
    return 0;
  }

  return count || 0;
}

// ============================================================================
// Snapshot Updater
// ============================================================================

async function updateSnapshotWithUserData(snapshot) {
  const date = snapshot.snapshot_date;
  console.log(`\n📊 Processing ${date}...`);

  // Count historical data
  const users = await countUsersUntilDate(date);
  const messages = await countMessagesUntilDate(date);
  const issues = await countIssuesUntilDate(date);
  const conversations = await countConversationsUntilDate(date);

  console.log(`   👥 Users: ${users}`);
  console.log(`   💬 Messages: ${messages} (${conversations} conversations)`);
  console.log(`   🐛 Issues: ${issues.total} (${issues.open} open, ${issues.closed} closed, ${issues.in_progress} in progress)`);

  // Update snapshot
  const { error } = await supabase
    .from('project_snapshots')
    .update({
      total_users: users,
      active_users: users, // We can't determine historical "active" users, so assume all
      total_messages: messages,
      total_conversations: conversations,
      total_issues: issues.total,
      open_issues: issues.open,
      closed_issues: issues.closed,
      in_progress_issues: issues.in_progress,
    })
    .eq('id', snapshot.id);

  if (error) {
    console.log(`   ❌ Failed to update: ${error.message}`);
    return false;
  }

  console.log(`   ✅ Updated snapshot`);
  return true;
}

// ============================================================================
// Main Backfill Logic
// ============================================================================

async function backfillUserData() {
  console.log('🚀 User Data Backfill for Snapshots');
  console.log('='.repeat(60));
  console.log('📅 Updating all existing snapshots with historical data\n');

  // Get all snapshots
  const { data: snapshots, error } = await supabase
    .from('project_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch snapshots:', error.message);
    process.exit(1);
  }

  if (!snapshots || snapshots.length === 0) {
    console.log('⚠️  No snapshots found in database');
    console.log('   Run backfill-snapshots-history.js first!');
    process.exit(0);
  }

  console.log(`📦 Found ${snapshots.length} snapshots to update\n`);

  let updated = 0;
  let errors = 0;

  for (const snapshot of snapshots) {
    const success = await updateSnapshotWithUserData(snapshot);
    if (success) {
      updated++;
    } else {
      errors++;
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Backfill Summary:');
  console.log(`   ✅ Updated:  ${updated} snapshots`);
  console.log(`   ❌ Errors:   ${errors} failures`);
  console.log('='.repeat(60));

  if (updated > 0) {
    console.log('\n🎉 SUCCESS! User data backfilled!');
    console.log('   View your charts at Admin Analytics page.');
  }
}

// ============================================================================
// Entry Point
// ============================================================================

async function main() {
  try {
    await backfillUserData();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
