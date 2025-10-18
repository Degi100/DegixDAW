#!/usr/bin/env node
// Claude creates an issue directly via issuesService
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🤖 Claude is creating an issue...\n');

// Get current user (you need to be logged in!)
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  console.error('❌ Not authenticated! Please login first.');
  console.log('   Tip: Open http://localhost:5173 and login as admin\n');
  process.exit(1);
}

console.log(`✅ Authenticated as: ${user.email}\n`);

// Create test issue
const issueData = {
  title: '🤖 Test Issue created by Claude',
  description: `This is a test issue created directly by Claude AI via issuesService.

**Purpose:** Testing Claude ↔ Issues Integration

**Next Steps:**
- Verify issue appears in Admin Panel
- Test Claude can read this issue
- Test Claude can update/comment on it

**Technical Details:**
- Created via: issuesService.createIssue()
- Created by: ${user.email}
- Timestamp: ${new Date().toISOString()}`,
  priority: 'high',
  category: 'Testing',
  labels: ['feature', 'urgent'],
  status: 'open'
};

const { data: issue, error: createError } = await supabase
  .from('issues')
  .insert({
    ...issueData,
    created_by: user.id,
    labels: issueData.labels,
  })
  .select()
  .single();

if (createError) {
  console.error('❌ Failed to create issue:', createError.message);
  process.exit(1);
}

console.log('✅ Issue created successfully!\n');
console.log('📋 Issue Details:');
console.log(`   ID: ${issue.id}`);
console.log(`   Title: ${issue.title}`);
console.log(`   Status: ${issue.status}`);
console.log(`   Priority: ${issue.priority}`);
console.log(`   Labels: ${issue.labels.join(', ')}`);
console.log(`\n🌐 View in Admin Panel:`);
console.log(`   http://localhost:5173/admin/issues\n`);

console.log('💬 Now respond with your feedback!\n');
