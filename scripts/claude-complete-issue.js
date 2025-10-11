#!/usr/bin/env node
// Claude marks an issue as done

const issueId = 'a773be23-45c2-43e7-9a87-259245da3658'; // Role Badge

console.log('🤖 Claude is completing the issue...\n');

// Add completion comment
fetch(`http://localhost:3001/api/issues/${issueId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    comment: `✅ **Issue completed!**

**Implementation:**

1. ✅ Created RoleBadge component (\`src/components/dashboard/RoleBadge.tsx\`)
   - Shows user role with appropriate emoji and styling
   - Supports all roles: Super Admin, Admin, Moderator, Beta User, User
   - Uses \`useAdmin\` hook for role detection

2. ✅ Integrated in Dashboard (\`src/components/dashboard/WelcomeCard.tsx\`)
   - RoleBadge displayed directly below Verification Status
   - Follows existing design pattern in user-details section

3. ✅ Added SCSS styling (\`src/styles/pages/dashboard/_dashboard-profile.scss\`)
   - Color gradients for each role (Super Admin: Red, Admin: Blue, Moderator: Purple, Beta: Yellow, User: Gray)
   - Box-shadow and border styling for professional look
   - Consistent with existing design system

**Files Changed:**
- \`src/components/dashboard/RoleBadge.tsx\` (new)
- \`src/components/dashboard/WelcomeCard.tsx\` (import + integration)
- \`src/styles/pages/dashboard/_dashboard-profile.scss\` (styling)

**Test in Browser:**
Navigate to Dashboard → Scroll to Profile Section → See Role Badge below Status

🤖 Completed by Claude Code`,
    metadata: { created_by_ai: true }
  })
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Completion comment added!');
      console.log('\n📝 Updating status to "done"...');

      // Update status to done
      return fetch(`http://localhost:3001/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'done',
          metadata: {
            completed_by_ai: true,
            completed_at: new Date().toISOString()
          }
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
      console.log('✅ Status updated to "done"!');
      console.log('\n🎉 Issue completed successfully!');
      console.log('🌐 View in Admin Panel: http://localhost:5173/admin/issues');
    } else {
      console.error('❌ Failed to update status:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
