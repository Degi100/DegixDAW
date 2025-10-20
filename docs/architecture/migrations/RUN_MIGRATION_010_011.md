# Migration 010 & 011: Avatar System

**Created:** 2025-10-20
**Branch:** `feat/avatar-system`
**Status:** ⏳ Pending Execution

---

## 📋 What This Does

**Migration 010:**
- Adds `avatar_url` column to `profiles` table
- Optional column (nullable)
- No breaking changes

**Migration 011:**
- Creates `avatars` storage bucket
- Sets up RLS policies for upload/update/delete
- Makes avatars publicly readable

---

## ✅ Pre-Migration Checklist

- [ ] Backup database (if production)
- [ ] Verify Supabase connection
- [ ] Check current `profiles` schema
- [ ] Ensure you have admin/service_role access

---

## 🚀 How to Run

### Step 1: Add avatar_url Column

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Copy contents of `010_add_avatar_url.sql`
3. Execute SQL
4. Verify: `SELECT id, username, avatar_url FROM profiles LIMIT 5;`

**Expected Output:**
```
 id                                   | username | avatar_url
--------------------------------------+----------+------------
 xxx-xxx-xxx-xxx                      | testuser | null
```

---

### Step 2: Create Storage Bucket

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Copy contents of `011_create_avatars_bucket.sql`
3. Execute SQL
4. Go to **Storage** → Verify `avatars` bucket exists
5. Check RLS policies are enabled

**Expected Output:**
- ✅ Bucket `avatars` exists
- ✅ Public = `true`
- ✅ 4 RLS policies created

---

## 🧪 Testing

### Test 1: Query profiles with avatar_url
```sql
SELECT id, username, avatar_url FROM profiles WHERE avatar_url IS NOT NULL;
-- Should return empty (no avatars uploaded yet)
```

### Test 2: Check Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'avatars';
-- Should return: id=avatars, public=true
```

### Test 3: Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';
-- Should return 4 policies
```

---

## ⚠️ Rollback (If Needed)

**Rollback Migration 011 (Storage):**
```sql
-- Delete RLS policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;

-- Delete bucket (WARNING: Deletes all uploaded avatars!)
DELETE FROM storage.buckets WHERE id = 'avatars';
```

**Rollback Migration 010 (Column):**
```sql
-- Remove column (WARNING: Loses all avatar_url data!)
ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;
DROP INDEX IF EXISTS idx_profiles_avatar_url;
```

---

## 📊 Expected Impact

**Breaking Changes:** ❌ NONE
**Downtime:** ❌ NONE
**Data Loss Risk:** ⚠️ LOW (only if rollback)

**After Migration:**
- ✅ `profiles.avatar_url` column exists (all values = `null`)
- ✅ `avatars` storage bucket ready for uploads
- ✅ RLS policies protect user avatars
- ✅ Frontend code can start using `avatar_url`

---

## 🎯 Next Steps

After running migrations:
1. ✅ Service Layer: Update queries to fetch `avatar_url`
2. ✅ UI Components: Add image support with fallbacks
3. ✅ Upload UI: Build avatar upload in Settings
4. ✅ Test: Upload avatar + verify display

---

**Questions?** Check [02_DATABASE_SCHEMA.md](../02_DATABASE_SCHEMA.md) for full schema documentation.
