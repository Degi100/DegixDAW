#!/usr/bin/env node
// List all issues from API

console.log('🤖 Claude is fetching all issues...\n');

fetch('http://localhost:3001/api/issues')
  .then(res => res.json())
  .then(data => {
    if (!data.issues || data.issues.length === 0) {
      console.log('📭 No issues found in database.');
      return;
    }

    console.log(`📋 Total Issues: ${data.issues.length}\n`);

    data.issues.forEach((issue, idx) => {
      console.log(`[${idx + 1}] ${issue.title}`);
      console.log(`    ID: ${issue.id}`);
      console.log(`    Status: ${issue.status} | Priority: ${issue.priority}`);
      console.log(`    Labels: ${issue.labels?.join(', ') || 'none'}`);
      console.log(`    Category: ${issue.category || 'none'}`);
      console.log(`    Assigned: ${issue.assigned_to_name || 'unassigned'}`);
      console.log(`    Comments: ${issue.comments_count || 0}`);
      console.log('');
    });

    // Show newest open issue
    const openIssues = data.issues.filter(i => i.status === 'open');
    if (openIssues.length > 0) {
      const newest = openIssues[0];
      console.log('\n🆕 Newest Open Issue:');
      console.log(`   ${newest.title}`);
      console.log(`   ID: ${newest.id}`);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
