#!/usr/bin/env node
/**
 * Check Latest Snapshot in Database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Checking latest snapshot in database...\n');

async function checkSnapshot() {
  const { data, error } = await supabase
    .from('project_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No snapshots found in database!');
    return;
  }

  const snapshot = data[0];
  console.log('✅ Latest snapshot found:\n');
  console.log(`📅 Date: ${snapshot.snapshot_date}`);
  console.log(`👥 Users: ${snapshot.total_users}`);
  console.log(`💬 Messages: ${snapshot.total_messages}`);
  console.log(`🐛 Issues: ${snapshot.total_issues}`);
  console.log(`📝 LOC: ${snapshot.total_loc.toLocaleString()}`);
  console.log(`💾 DB Size: ${snapshot.database_size_mb} MB`);
  console.log(`🤖 Created via: ${snapshot.metadata?.created_via || 'unknown'}`);
  console.log(`\n✅ Snapshot exists and should be visible in chart!`);
}

checkSnapshot();