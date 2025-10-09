#!/usr/bin/env node
// Check ALL users in profiles table
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Checking ALL users in profiles table...\n');

const { data, error } = await supabase
  .from('profiles')
  .select('user_id, username, role, full_name')
  .limit(10);

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`Found ${data?.length || 0} users:\n`);
data?.forEach((user, index) => {
  console.log(`${index + 1}. Username: ${user.username || 'N/A'}`);
  console.log(`   Name: ${user.full_name || 'N/A'}`);
  console.log(`   Role: ${user.role || 'user'}`);
  console.log(`   User ID: ${user.user_id}`);
  console.log('');
});

// Find admin users
const admins = data?.filter(u => u.role === 'admin');
console.log(`\n📊 Summary:`);
console.log(`   Total users: ${data?.length || 0}`);
console.log(`   Admins: ${admins?.length || 0}`);

if (!admins || admins.length === 0) {
  console.log('\n💡 To set a user as admin, run this SQL in Supabase:');
  console.log(`   UPDATE profiles SET role = 'admin' WHERE username = 'YOUR_USERNAME';`);
}
