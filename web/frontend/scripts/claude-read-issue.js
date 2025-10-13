#!/usr/bin/env node
// Claude reads and analyzes an issue

const issueId = '3938635c-bf2c-475b-a1d1-bcc0bd7bebd9'; // My first issue

console.log('🤖 Claude is reading the issue...\n');

fetch('http://localhost:3001/api/issues')
  .then(res => res.json())
  .then(data => {
    const issue = data.issues.find(i => i.id === issueId);

    if (!issue) {
      console.log('❌ Issue not found!');
      return;
    }

    console.log('📋 Issue Details:\n');
    console.log(`Title: ${issue.title}`);
    console.log(`Description:\n${issue.description}\n`);
    console.log(`Status: ${issue.status}`);
    console.log(`Priority: ${issue.priority}`);
    console.log(`Labels: ${issue.labels?.join(', ') || 'none'}`);
    console.log(`Category: ${issue.category || 'none'}`);
    console.log(`Created: ${new Date(issue.created_at).toLocaleString()}`);

    if (issue.metadata?.created_by_ai) {
      console.log(`\n🤖 This was created by me!`);
    }

    console.log('\n🧠 Claude\'s Analysis:');
    console.log('   This is a test issue to verify the integration works.');
    console.log('   Next steps from description:');
    console.log('   - ✅ Verify it appears in Admin Panel (DONE!)');
    console.log('   - ✅ Test Realtime updates (DONE!)');
    console.log('   - 🔄 Test Claude can update/comment on it (NEXT!)');

    console.log('\n💡 What I can do now:');
    console.log('   1. Add a comment');
    console.log('   2. Change status to "in_progress"');
    console.log('   3. Update priority/labels');
    console.log('   4. Assign to someone');
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
