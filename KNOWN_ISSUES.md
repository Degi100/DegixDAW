# Known Issues - Claude ↔ Issues Integration

## 🐛 Bugs to Fix

### 1. Comment Loading fails in Frontend
**Status:** Not Fixed
**Priority:** Medium
**Created:** 2025-10-09

**Problem:**
- Claude can CREATE comments via API ✅
- Comments are saved in DB ✅
- Comment count shows in UI (e.g., "1") ✅
- BUT: Opening comment panel shows toast "Failed to load comments" ❌

**Likely Cause:**
- RLS Policy on `issue_comments` table blocks reading
- RPC function `get_comments_for_issue()` missing or has wrong permissions
- Frontend uses different auth context than API

**How to Reproduce:**
1. Claude creates comment via `POST /api/issues/:id/comments`
2. Open issue in Admin Panel
3. Click comment count badge
4. See error toast

**Next Steps:**
1. Check RLS policies on `issue_comments` table
2. Verify RPC function permissions
3. Test with Service Role Key vs Anon Key
4. Check `useIssueComments` hook error handling

**Workaround:**
- Use SQL to read comments: `SELECT * FROM issue_comments WHERE issue_id = 'xxx'`

---

## 🔧 Future Improvements

### 2. Realtime Updates unreliable
**Status:** Known Limitation (from CLAUDE.md)
**Priority:** Low

**Problem:**
- INSERT events work (new issues show without refresh)
- UPDATE events don't trigger UI refresh
- Users need manual refresh after edits

**Solution:**
- Already documented in CLAUDE.md
- Manual `refresh()` calls after CRUD operations

---

## 📋 Backlog

- [ ] Fix Comment Loading RLS/RPC issue
- [ ] Improve Realtime reliability for UPDATEs
- [ ] Add better error messages in UI
