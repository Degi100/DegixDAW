#!/usr/bin/env node
/**
 * Test Direct Insert with Service Role Key
 *
 * This tests if we can insert a snapshot using Service Role Key
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

console.log('🧪 Testing Direct Insert with Service Role Key\n');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Service Key: ${SERVICE_KEY ? 'Found ✅' : 'Missing ❌'}\n`);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testInsert() {
  console.log('🔄 Attempting to insert test snapshot...\n');

  const testSnapshot = {
    snapshot_date: '2025-10-11',
    total_loc: 99999,
    total_files: 999,
    total_commits: 999,
    total_users: 6,
    active_users: 5,
    total_messages: 24,
    total_conversations: 3,
    total_issues: 12,
    open_issues: 3,
    closed_issues: 7,
    in_progress_issues: 2,
    database_size_mb: 15.0,
    storage_size_mb: 0,
    total_storage_mb: 15.0,
    typescript_loc: 8000,
    javascript_loc: 1500,
    scss_loc: 400,
    css_loc: 100,
    sql_loc: 0,
    json_loc: 0,
    markdown_loc: 0,
    created_by: null,
    metadata: {
      created_via: 'test_script',
      test: true
    }
  };

  console.log('📊 Test data:');
  console.log(`   Date: ${testSnapshot.snapshot_date}`);
  console.log(`   Users: ${testSnapshot.total_users}`);
  console.log(`   Messages: ${testSnapshot.total_messages}\n`);

  const { data, error } = await supabase
    .from('project_snapshots')
    .insert(testSnapshot)
    .select()
    .single();

  if (error) {
    console.error('❌ INSERT FAILED!');
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Details: ${JSON.stringify(error.details, null, 2)}`);
    console.error(`   Hint: ${error.hint}`);
    return;
  }

  console.log('✅ INSERT SUCCESS!');
  console.log(`   ID: ${data.id}`);
  console.log(`   Date: ${data.snapshot_date}`);
  console.log(`   Users: ${data.total_users}`);
  console.log(`   Messages: ${data.total_messages}\n`);

  console.log('🎉 Service Role Key works! GitHub Actions should work too!');
  console.log('\n🧹 Cleanup (delete test snapshot):');

  const { error: deleteError } = await supabase
    .from('project_snapshots')
    .delete()
    .eq('id', data.id);

  if (deleteError) {
    console.log(`   ⚠️  Could not delete test snapshot (ID: ${data.id})`);
    console.log(`   You may want to delete it manually.`);
  } else {
    console.log('   ✅ Test snapshot deleted');
  }
}

testInsert();
