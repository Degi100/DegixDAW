#!/usr/bin/env node
/**
 * Quick Database Check - Analytics Setup
 *
 * Checks if all required database objects exist
 * WITHOUT needing Service Role Key (uses anon key)
 *
 * Usage: node scripts/analytics/quick-check-db.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables in .env.local:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Quick Analytics DB Check');
console.log('=================================\n');

async function checkDatabase() {
  let allGood = true;

  // Check 1: Table project_snapshots exists
  console.log('1️⃣ Checking table project_snapshots...');
  try {
    const { error } = await supabase
      .from('project_snapshots')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('   ❌ Table project_snapshots NOT FOUND!');
      console.log('   👉 Run: npm run db:sql analytics_snapshots_table\n');
      allGood = false;
    } else if (error) {
      console.log('   ⚠️  Access error (might be RLS):', error.message);
      console.log('   ℹ️  Table probably exists but you need admin access\n');
    } else {
      console.log('   ✅ Table project_snapshots exists\n');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message, '\n');
    allGood = false;
  }

  // Check 2: RPC function get_database_size exists
  console.log('2️⃣ Checking RPC function get_database_size...');
  try {
    const { data, error } = await supabase.rpc('get_database_size');

    if (error && error.code === '42883') {
      console.log('   ❌ Function get_database_size NOT FOUND!');
      console.log('   👉 Run: npm run db:sql analytics_storage_functions\n');
      allGood = false;
    } else if (error) {
      console.log('   ⚠️  Function exists but returned error:', error.message);
      console.log('   ℹ️  This might be a permissions issue\n');
    } else {
      const sizeMB = (data / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ Function get_database_size works! (DB size: ${sizeMB} MB)\n`);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message, '\n');
    allGood = false;
  }

  // Summary
  console.log('=================================');
  if (allGood) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('🚀 GitHub Actions should work now!');
    console.log('');
    console.log('🧪 Test it:');
    console.log('   https://github.com/Degi100/DegixDAW/actions');
  } else {
    console.log('❌ SOME CHECKS FAILED!');
    console.log('');
    console.log('🔧 Fix steps:');
    console.log('   1. Open Supabase SQL Editor:');
    console.log('      https://supabase.com/dashboard/project/_/sql');
    console.log('');
    console.log('   2. Copy & paste SQL from:');
    console.log('      npm run db:show scripts/sql/analytics_snapshots_table.sql');
    console.log('      npm run db:show scripts/sql/analytics_snapshots_language_breakdown.sql');
    console.log('      npm run db:show scripts/sql/analytics_storage_functions.sql');
    console.log('');
    console.log('   3. Click "Run" for each script');
    console.log('');
    console.log('   4. Re-run this check:');
    console.log('      node scripts/analytics/quick-check-db.js');
  }
  console.log('=================================\n');
}

checkDatabase();