#!/usr/bin/env node
/**
 * Claude Batch Issue Creator
 * Creates multiple issues using Service Role Key + RPC
 *
 * Prerequisites: npm run db:sql scripts/sql/get_user_id_by_email.sql
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🤖 Claude Batch Issue Creator\n');

// Get User ID via RPC (joins auth.users + profiles)
const { data: userId, error: rpcError } = await supabase
  .rpc('get_user_id_by_email', { user_email: process.env.VITE_SUPER_ADMIN_EMAIL });

if (rpcError || !userId) {
  console.error('❌ RPC Error:', rpcError?.message || 'User not found');
  console.log('   Fix: npm run db:sql scripts/sql/get_user_id_by_email.sql\n');
  process.exit(1);
}

console.log(`✅ User: ${process.env.VITE_SUPER_ADMIN_EMAIL}\n`);

const issues = [
  { title: '🔊 Sound Toggle Button im Header', description: 'Toggle Button neben Darkmode (Sonne/Mond)\nSound On/Off für Notifications', category: 'feature', priority: 'low', labels: ['enhancement', 'ux'], status: 'open' }
];

console.log('🤖 Creating issue...\n');

let successCount = 0;
for (const issue of issues) {
  const { error } = await supabase.from('issues').insert({ ...issue, created_by: userId });
  if (error) {
    console.log(`❌ ${issue.title}: ${error.message}`);
  } else {
    console.log(`✅ ${issue.title}`);
    successCount++;
  }
}

console.log(`\n✅ Created ${successCount}/${issues.length} issues`);
console.log('🌐 View: http://localhost:5173/admin/issues\n');
