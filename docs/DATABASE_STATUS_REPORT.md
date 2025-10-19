# 📊 Database Status Report - DegixDAW

**Date:** 2025-01-19
**Branch:** `feat/project-system`
**Reporter:** Claude

---

## ✅ Summary

**Good News:** Die Basis-Tabellen aus `001_create_tables.sql` sind **perfekt** für Phase 1!

**Action Needed:** Wir brauchen 2 neue Tabellen + 1 Spalte für den MASTERPLAN.

---

## 📋 Current Database Status

### ✅ **EXISTING TABLES (from 001_create_tables.sql)**

| Table | Rows | Status | Use in Phase 1 |
|-------|------|--------|----------------|
| `projects` | 0 | ✅ Ready | Week 1-2: Project Creation |
| `project_collaborators` | 0 | ⚠️ Missing `invite_method` column | Week 1-2: Invitations |
| `tracks` | 0 | ✅ Ready | Week 3-4: Track Upload |
| `track_comments` | 0 | ✅ Ready | Week 5-6: Feedback System |
| `mixdowns` | 0 | ✅ Ready (Future) | Later: Mixdown Export |
| `presets` | 0 | ✅ Ready (Future) | Later: Preset Sharing |
| `midi_events` | 0 | ✅ Ready (Future) | Later: MIDI Editor |
| `project_versions` | 0 | ✅ Ready (Future) | Later: Project Snapshots |

### ❌ **MISSING TABLES (from MASTERPLAN)**

| Table | Priority | Needed For | Phase |
|-------|----------|------------|-------|
| `project_invites` | **HIGH** | Invite Links (`degixdaw.com/invite/abc123`) | Week 1-2 |
| `track_versions` | **MEDIUM** | Track Versioning (v1, v2, v3...) | Week 3-4 |

### ⚠️ **MISSING COLUMNS**

| Table | Column | Type | Needed For |
|-------|--------|------|------------|
| `project_collaborators` | `invite_method` | `TEXT CHECK (...)` | Track how user was invited (username/link/chat) |

---

## 🛠️ Migration Plan

### **STEP 1: Run Migration 004**

**File:** `docs/architecture/migrations/004_masterplan_additions.sql`

**What it does:**
1. ✅ Adds `invite_method` column to `project_collaborators`
2. ✅ Creates `project_invites` table
3. ✅ Creates `track_versions` table
4. ✅ Sets up RLS policies for both tables
5. ✅ Adds helper functions:
   - `generate_invite_code(length)` - Generate random invite codes
   - `is_invite_valid(code)` - Check if invite is usable
   - `use_invite_code(code, user_id)` - Redeem invite + add collaborator

**How to run:**
```sql
-- In Supabase SQL Editor:
-- 1. Copy/paste entire file
-- 2. Execute
-- 3. Verify with:
SELECT COUNT(*) FROM project_invites;
SELECT COUNT(*) FROM track_versions;
```

---

### **STEP 2: Verify Migration Success**

**File:** `docs/architecture/migrations/CHECK_DATABASE_STATUS.sql`

Run this to verify everything worked:
```sql
-- Check all project-related tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'projects',
    'project_collaborators',
    'project_invites',
    'tracks',
    'track_versions',
    'track_comments'
  );

-- Should return 6 rows!
```

---

## 📊 Database Schema Comparison

### **MASTERPLAN vs CURRENT:**

```diff
PHASE 1 TABLES (Week 1-2):
+ projects ✅ EXISTS
+ project_collaborators ✅ EXISTS
-   Missing column: invite_method ⚠️
+ project_invites ❌ MISSING (needs Migration 004)

PHASE 1 TABLES (Week 3-4):
+ tracks ✅ EXISTS
+ track_versions ❌ MISSING (needs Migration 004)

PHASE 1 TABLES (Week 5-6):
+ track_comments ✅ EXISTS

FUTURE TABLES:
+ mixdowns ✅ EXISTS
+ presets ✅ EXISTS
+ midi_events ✅ EXISTS
+ project_versions ✅ EXISTS
```

---

## 🎯 Next Steps

### **Immediate (Before Coding):**

1. **Run Migration 004 in Supabase:**
   ```bash
   # Copy content of 004_masterplan_additions.sql
   # Paste into Supabase SQL Editor
   # Execute
   ```

2. **Verify Success:**
   ```sql
   SELECT COUNT(*) FROM project_invites;  -- Should work!
   SELECT COUNT(*) FROM track_versions;   -- Should work!
   ```

3. **Update CLAUDE.md:**
   - Mark Migration 004 as ✅ DONE
   - Update database status to ~25% complete

### **After Migration:**

4. **Start Frontend Development:**
   - Create TypeScript types for new tables
   - Build `useProjects.ts` hook
   - Build `ProjectCreateModal.tsx`

---

## 🔐 RLS Policies Overview

### **project_invites:**

| Policy | Action | Rule |
|--------|--------|------|
| View invites | SELECT | Owner or collaborator can view |
| Create invite | INSERT | Owner can create |
| Create invite | INSERT | Collaborators with `can_invite_others=true` |
| Delete invite | DELETE | Creator can delete own invites |

### **track_versions:**

| Policy | Action | Rule |
|--------|--------|------|
| View versions | SELECT | Anyone with project access |
| Create version | INSERT | Contributors with `can_upload_audio=true` |

---

## 📝 Notes for Developer

### **Why `project_invites` is separate from `project_collaborators`:**

- **project_collaborators** = Actual members of project
- **project_invites** = Pending invitations (links that haven't been used yet)

**Flow:**
```
1. Owner creates invite → project_invites row created
2. User clicks link → use_invite_code() function
3. User becomes collaborator → project_collaborators row created
4. Invite used_count increments
```

### **Why `track_versions` is separate from `tracks`:**

- **tracks** = Current/active track
- **track_versions** = Historical versions (v1, v2, v3...)

**Flow:**
```
1. User uploads piano_v1.wav → tracks + track_versions
2. User uploads piano_v2.wav → tracks.file_path updated
                               → New track_versions row
                               → Old version still in track_versions
```

---

## 🧪 Test Queries

### **Test 1: Create Invite Code**

```sql
-- Generate random invite code
SELECT generate_invite_code(8);

-- Example output: "aBc12XyZ"
```

### **Test 2: Create Invite Link**

```sql
-- Insert test invite
INSERT INTO project_invites (
  project_id,
  invite_code,
  created_by,
  max_uses
) VALUES (
  'some-project-uuid',
  generate_invite_code(8),
  'some-user-uuid',
  10  -- Max 10 uses
);
```

### **Test 3: Use Invite Code**

```sql
-- Redeem invite
SELECT use_invite_code('aBc12XyZ', 'new-user-uuid');

-- Check if user was added to project_collaborators
SELECT * FROM project_collaborators WHERE user_id = 'new-user-uuid';
```

---

## 🚨 Known Issues

### **Issue 1: Migration 001 was executed, but no data exists**

**Status:** Expected! We haven't built the frontend yet.

**Next:** After Migration 004, we build the UI to create projects.

### **Issue 2: Some tables from 001 aren't needed for Phase 1**

**Tables we DON'T need yet:**
- `mixdowns` - Only for export (Phase 2+)
- `presets` - Only for preset sharing (Phase 3+)
- `midi_events` - Only for MIDI editor (Phase 3+)
- `project_versions` - Only for project snapshots (Phase 2+)

**These are fine!** They don't hurt anything. We'll use them later.

---

## 📈 Database Growth Estimation

### **Phase 1 (6 weeks):**

Assuming 10 beta users testing:

| Table | Estimated Rows | Size |
|-------|----------------|------|
| `projects` | ~50 | 100 KB |
| `project_collaborators` | ~150 (3 per project) | 50 KB |
| `project_invites` | ~30 (some unused) | 10 KB |
| `tracks` | ~200 (4 per project) | 500 KB |
| `track_versions` | ~400 (2 versions/track) | 1 MB |
| `track_comments` | ~500 | 200 KB |

**Total:** ~2 MB (database only, files separate in Storage)

---

## ✅ Checklist Before Starting Frontend

- [x] Review existing tables from Migration 001
- [x] Identify missing tables from MASTERPLAN
- [x] Create Migration 004 script
- [x] Document database status
- [ ] Run Migration 004 in Supabase ← **DO THIS NEXT!**
- [ ] Verify tables exist with CHECK_DATABASE_STATUS.sql
- [ ] Create TypeScript types in `packages/types/`
- [ ] Start building frontend components

---

**Status:** 🟡 **READY FOR MIGRATION**

Migration 004 is prepared and ready to execute. Once run, we can start building the frontend immediately!

---

*Report generated: 2025-01-19*
*Branch: feat/project-system*
