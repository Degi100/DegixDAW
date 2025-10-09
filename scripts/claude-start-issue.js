#!/usr/bin/env node
// Claude starts working on an issue

const issueId = 'a773be23-45c2-43e7-9a87-259245da3658'; // Role Badge

console.log('🤖 Claude is starting work on the issue...\n');

// First, fetch issue details
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
    console.log(`Description:\n${issue.description || '(no description)'}\n`);
    console.log(`Status: ${issue.status}`);
    console.log(`Priority: ${issue.priority}`);
    console.log(`Category: ${issue.category || 'none'}`);
    console.log(`Labels: ${issue.labels?.join(', ') || 'none'}`);
    console.log(`Assigned: ${issue.assigned_to_name || 'unassigned'}`);
    console.log(`Comments: ${issue.comments_count || 0}`);
    console.log(`Created: ${new Date(issue.created_at).toLocaleString()}`);

    console.log('\n🚀 Next Steps:');
    console.log('   1. Add comment that Claude is starting work');
    console.log('   2. Change status to "in_progress"');
    console.log('   3. Implement the feature');
    console.log('   4. Update status to "done" when complete');

    // Add comment that Claude is starting
    console.log('\n💬 Adding comment...');
    return fetch(`http://localhost:3001/api/issues/${issueId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: '🤖 Claude started working on this issue!\n\n**Plan:**\n1. Analyze requirements\n2. Implement role badge component\n3. Test and verify\n4. Mark as done',
        metadata: { created_by_ai: true }
      })
    });
  })
  .then(res => {
    if (!res) return null;
    return res.json();
  })
  .then(data => {
    if (!data) return;

    if (data.success) {
      console.log('✅ Comment added!');

      // Now update status to in_progress
      console.log('📝 Updating status to "in_progress"...');
      return fetch(`http://localhost:3001/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress'
        })
      });
    } else {
      console.error('❌ Failed to add comment:', data.error);
    }
  })
  .then(res => {
    if (!res) return null;
    return res.json();
  })
  .then(data => {
    if (!data) return;

    if (data.success) {
      console.log('✅ Status updated to "in_progress"!');
      console.log('\n🎉 Issue started successfully!');
      console.log('🌐 View in Admin Panel: http://localhost:5173/admin/issues');
    } else {
      console.error('❌ Failed to update status:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
