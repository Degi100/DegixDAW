#!/usr/bin/env node
// Claude adds a comment to an issue

const issueId = '3938635c-bf2c-475b-a1d1-bcc0bd7bebd9';
const comment = `🤖 **Claude's First Comment!**

I successfully:
- ✅ Created this issue via API
- ✅ Read and analyzed the description
- ✅ Updated the description automatically

Next up:
- Testing auto-reactions when YOU create issues
- Building the lock system
- Implementing auto-status changes

This is amazing! The integration works perfectly! 🎉`;

console.log('💬 Claude is adding a comment...\n');

fetch(`http://localhost:3001/api/issues/${issueId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ comment })
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Comment added successfully!\n');
      console.log('📝 Comment Details:');
      console.log(`   ID: ${data.comment.id}`);
      console.log(`   Created: ${new Date(data.comment.created_at).toLocaleString()}`);
      console.log(`\n🌐 Check in Admin Panel - Comment Panel on the right!`);
    } else {
      console.error('❌ Error:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Request failed:', err.message);
  });
