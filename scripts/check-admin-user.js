#!/usr/bin/env node
// Check if admin user exists
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Checking for admin users...\n');

const { data, error } = await supabase
  .from('profiles')
  .select('user_id, username, role, full_name')
  .eq('role', 'admin');

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`Found ${data?.length || 0} admin users:`);
data?.forEach(user => {
  console.log(`   - ${user.username || 'No username'} (${user.full_name || 'No name'}) - user_id: ${user.user_id}`);
});

if (!data || data.length === 0) {
  console.log('\n⚠️  No admin users found!');
  console.log('   Make sure you are logged in as admin in the frontend.');
}
