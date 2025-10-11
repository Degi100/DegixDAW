#!/usr/bin/env node
// List all issues via Claude API

console.log('🔍 Fetching all issues via Claude API...\n');

fetch('http://localhost:3001/api/issues')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log(`📋 Total Issues: ${data.issues.length}\n`);

      if (data.issues.length === 0) {
        console.log('   No issues found.');
      } else {
        data.issues.forEach((issue, idx) => {
          console.log(`${idx + 1}. [${issue.status}] ${issue.title}`);
          console.log(`   Priority: ${issue.priority} | Created by: ${issue.created_by_username || issue.created_by_email}`);
          console.log(`   ID: ${issue.id}`);
          if (issue.metadata?.created_by_ai) {
            console.log(`   🤖 Created by AI: ${issue.metadata.ai_name}`);
          }
          console.log('');
        });
      }
    } else {
      console.error('❌ Error:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Request failed:', err.message);
  });
