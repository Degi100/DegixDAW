#!/usr/bin/env node
// Quick DB Connection + Issues Table Check
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Checking DB Connection...\n');

// 1. Test basic connection
const { data: healthCheck, error: healthError } = await supabase
  .from('profiles')
  .select('count')
  .limit(1);

if (healthError) {
  console.error('❌ DB Connection FAILED:', healthError.message);
  process.exit(1);
}

console.log('✅ DB Connection OK\n');

// 2. Check issues table
const { data: issuesCheck, error: issuesError } = await supabase
  .from('issues')
  .select('id, title, status, priority')
  .limit(5);

if (issuesError) {
  console.error('❌ Issues Table NOT FOUND:', issuesError.message);
  console.log('\n📝 Run: npm run db:sql scripts/sql/issues_system_setup.sql\n');
  process.exit(1);
}

console.log('✅ Issues Table EXISTS');
console.log(`📊 Sample Issues (${issuesCheck?.length || 0}):`);
issuesCheck?.forEach(issue => {
  console.log(`   - [${issue.status}] ${issue.title} (Priority: ${issue.priority})`);
});

// 3. Check RPC function
const { data: rpcCheck, error: rpcError } = await supabase
  .rpc('get_issues_with_details');

if (rpcError) {
  console.error('\n⚠️  RPC Function MISSING:', rpcError.message);
  console.log('   Run: npm run db:sql scripts/sql/issues_system_setup.sql');
} else {
  console.log(`\n✅ RPC Function OK (${rpcCheck?.length || 0} issues with details)`);
}

console.log('\n🎉 All Systems Ready!\n');
