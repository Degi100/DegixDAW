# Migration 004: Shared Files - EXECUTION GUIDE

## ⚠️ CRITICAL: You must run this migration in Supabase!

The build was successful, but the database errors show that the migration hasn't been executed yet.

## Errors you're seeing:

```
Error: Could not find a relationship between 'shared_files' and 'profiles'
Error: column p.avatar_url does not exist
```

## ✅ How to fix:

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your DegixDAW project

### Step 2: Open SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **New query**

### Step 3: Copy & Paste Migration
1. Open the file: `docs/architecture/migrations/004_shared_files.sql`
2. Copy **ALL** the content (all 283 lines)
3. Paste into Supabase SQL Editor

### Step 4: Execute Migration
1. Click **Run** button (or press Ctrl+Enter)
2. Wait for success message

### Step 5: Verify Success
Run this verification query in Supabase SQL Editor:

```sql
-- Should return all columns of shared_files table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shared_files';

-- Should return the storage bucket
SELECT * FROM storage.buckets WHERE id = 'shared_files';

-- Should return 6 RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'shared_files';
```

### Step 6: Test in Browser
1. Refresh your frontend: http://localhost:5173
2. Navigate to File Browser
3. The errors should be gone!

## What this migration creates:

- ✅ `shared_files` table (file metadata + status tracking)
- ✅ 5 performance indexes
- ✅ 6 RLS policies (security)
- ✅ 2 triggers (auto-update timestamps)
- ✅ `shared_files` storage bucket
- ✅ 4 storage RLS policies
- ✅ 2 helper functions: `get_sender_statistics()`, `mark_file_as_read()`

## 🎯 Expected Database Size Change:

Before: ~17 MB (from migration 003)
After: ~17.1 MB (shared_files is currently empty)

---

**After running the migration, refresh your browser and the file-sharing system will work!**
