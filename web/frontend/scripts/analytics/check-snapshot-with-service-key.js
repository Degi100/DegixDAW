#!/usr/bin/env node
/**
 * Check Snapshot with Service Role Key (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔍 Checking snapshots (with Service Role Key)...\n');

async function checkSnapshots() {
  const { data, error } = await supabase
    .from('project_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No snapshots found!');
    return;
  }

  console.log(`✅ Found ${data.length} snapshot(s):\n`);

  data.forEach((snapshot, i) => {
    console.log(`${i + 1}. 📅 ${snapshot.snapshot_date}`);
    console.log(`   👥 Users: ${snapshot.total_users}`);
    console.log(`   💬 Messages: ${snapshot.total_messages}`);
    console.log(`   🐛 Issues: ${snapshot.total_issues}`);
    console.log(`   📝 LOC: ${snapshot.total_loc.toLocaleString()}`);
    console.log(`   🤖 Via: ${snapshot.metadata?.created_via || 'unknown'}\n`);
  });
}

checkSnapshots();
