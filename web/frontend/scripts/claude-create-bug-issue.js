#!/usr/bin/env node
// Claude creates a bug issue for the comment loading problem

const issueData = {
  title: '🐛 Comment Loading fails in Frontend',
  description: `**Problem:**
- Claude can CREATE comments via API ✅
- Comments are saved in DB ✅
- Comment count shows in UI (e.g., "1") ✅
- BUT: Opening comment panel shows toast "Failed to load comments" ❌

**Likely Cause:**
- RLS Policy on \`issue_comments\` table blocks reading
- RPC function missing or has wrong permissions
- Frontend uses different auth context than API

**How to Reproduce:**
1. Claude creates comment via \`POST /api/issues/:id/comments\`
2. Open issue in Admin Panel
3. Click comment count badge
4. See error toast: "Failed to load comments"

**Next Steps:**
1. Check RLS policies on \`issue_comments\` table
2. Verify RPC function permissions
3. Test with Service Role Key vs Anon Key
4. Check \`useIssueComments\` hook error handling

**Workaround:**
- Use SQL to read comments: \`SELECT * FROM issue_comments WHERE issue_id = 'xxx'\`

---
🤖 **Created by Claude** - First bug report from AI!`,
  priority: 'medium',
  category: 'Bug',
  labels: ['bug', 'urgent']
};

console.log('🤖 Claude is creating a bug issue...\n');

fetch('http://localhost:3001/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(issueData)
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Bug issue created successfully!\n');
      console.log('📋 Issue Details:');
      console.log(`   ID: ${data.issue.id}`);
      console.log(`   Title: ${data.issue.title}`);
      console.log(`   Priority: ${data.issue.priority}`);
      console.log(`   Labels: ${data.issue.labels.join(', ')}`);
      console.log(`\n🌐 View in Admin Panel:`);
      console.log(`   http://localhost:5173/admin/issues\n`);
      console.log('🎉 My first bug report as an AI!');
    } else {
      console.error('❌ Error:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Request failed:', err.message);
  });
