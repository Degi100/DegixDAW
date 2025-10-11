#!/usr/bin/env node
// Test Claude's API - Create Issue

const issueData = {
  title: '🤖 Claude\'s First Issue',
  description: 'This is my first issue created via the API! Testing the Claude ↔ Issues integration.\n\nNext steps:\n- Verify it appears in Admin Panel\n- Test Realtime updates',
  priority: 'high',
  category: 'Testing',
  labels: ['feature', 'urgent']
};

console.log('🤖 Claude is creating an issue via API...\n');

fetch('http://localhost:3001/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(issueData)
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Issue created successfully!\n');
      console.log('📋 Issue Details:');
      console.log(`   ID: ${data.issue.id}`);
      console.log(`   Title: ${data.issue.title}`);
      console.log(`   Status: ${data.issue.status}`);
      console.log(`   Priority: ${data.issue.priority}`);
      console.log(`   Labels: ${data.issue.labels.join(', ')}`);
      console.log(`\n🌐 View in Admin Panel:`);
      console.log(`   http://localhost:5173/admin/issues\n`);
    } else {
      console.error('❌ Error:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Request failed:', err.message);
  });
