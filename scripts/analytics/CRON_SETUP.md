# Automated Daily Snapshots - Cron Job Setup

Automatically capture project analytics snapshots every day at midnight UTC using Supabase's pg_cron extension.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [What Gets Tracked](#what-gets-tracked)
- [Configuration Options](#configuration-options)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)
- [Alternative: Edge Functions](#alternative-edge-functions)

---

## 🎯 Overview

The automated snapshot system creates daily snapshots of your project metrics without manual intervention. These snapshots power the **GrowthChart** timeline in the Admin Analytics Dashboard.

**Features:**
- ⏰ Runs automatically at 00:00 UTC every day
- 📊 Tracks users, messages, issues, and storage metrics
- 🧹 Auto-cleanup of snapshots older than 90 days (monthly)
- 🔒 Admin-only access via RLS policies
- 🚀 Manual trigger available for testing

**Important Notes:**
- **Code metrics** (LOC, files, commits) are NOT tracked by cron due to GitHub API requirements
- Admins can manually trigger full snapshots (including code metrics) via the "Create Snapshot" button in the dashboard
- Cron-created snapshots have `created_via: 'cron_job'` in metadata

---

## 📦 Prerequisites

### Option 1: Supabase Pro Plan (Recommended)

If you're on **Supabase Pro** or higher, pg_cron is available natively:

1. ✅ Supabase Pro Plan or higher
2. ✅ `project_snapshots` table exists ([analytics_snapshots_table.sql](../sql/analytics_snapshots_table.sql))
3. ✅ Language breakdown columns added ([analytics_snapshots_language_breakdown.sql](../sql/analytics_snapshots_language_breakdown.sql))

### Option 2: Self-Hosted Supabase

If you're self-hosting Supabase, you need to:

1. Enable `pg_cron` extension in PostgreSQL
2. Follow the same setup steps as Pro users

### Option 3: Supabase Free Tier

If you're on the **Free Tier**, pg_cron is NOT available. See [Alternative: Edge Functions](#alternative-edge-functions) below.

---

## 🚀 Quick Start

### Step 1: Verify Prerequisites

Ensure the snapshots table and language breakdown exist:

```bash
# Create snapshots table (if not already created)
npm run db:sql analytics_snapshots_table

# Add language breakdown columns
npm run db:sql analytics_snapshots_language_breakdown
```

### Step 2: Run Setup Script

Run the cron setup script to:
- Create the `create_daily_snapshot()` function
- Schedule daily cron job at 00:00 UTC
- Schedule monthly cleanup job
- Enable monitoring queries

```bash
npm run analytics:setup-cron
```

**Expected Output:**
```
✅ Automated daily snapshots configured!
⏰ Cron Job: Runs every day at 00:00 UTC
📊 Tracks: Users, Messages, Issues, Storage
⚠️  Code metrics (LOC, files, commits) require manual snapshot via admin button
🧹 Cleanup: Runs monthly, keeps last 90 days
```

### Step 3: Test Manual Trigger

Verify the function works by creating a snapshot immediately:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM create_daily_snapshot();
```

**Expected Response:**
```
snapshot_id | snapshot_date | message
------------|---------------|--------
abc-123-... | 2025-10-11    | Snapshot created successfully! Users: 42, Messages: 1337, Issues: 23
```

### Step 4: Verify Cron Job

Check that the cron job is scheduled:

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- Expected output includes:
-- jobname: 'daily_project_snapshot'
-- schedule: '0 0 * * *'
-- active: true
```

---

## 📊 What Gets Tracked

### ✅ Automatically Tracked (by Cron)

| Metric Category | Fields Tracked |
|-----------------|----------------|
| **Users** | `total_users`, `active_users` |
| **Chat** | `total_messages`, `total_conversations` |
| **Issues** | `total_issues`, `open_issues`, `closed_issues`, `in_progress_issues` |
| **Storage** | `database_size_mb`, `storage_size_mb`, `total_storage_mb` |

### ❌ NOT Tracked by Cron (Manual Only)

| Metric Category | Fields | Reason |
|-----------------|--------|--------|
| **Code Metrics** | `total_loc`, `total_files`, `total_commits` | Requires GitHub API (not available in DB) |
| **Language Stats** | `typescript_loc`, `javascript_loc`, `scss_loc`, etc. | Same as above |

**Solution:** Use the **"Create Snapshot"** button in the Admin Analytics Dashboard to create full snapshots with code metrics.

---

## ⚙️ Configuration Options

### Change Cron Schedule

Edit the cron expression in [analytics_snapshots_cron.sql](../sql/analytics_snapshots_cron.sql):

```sql
-- Current: Daily at 00:00 UTC
SELECT cron.schedule(
  'daily_project_snapshot',
  '0 0 * * *',  -- <-- Edit this line
  $$SELECT create_daily_snapshot()$$
);
```

**Common Cron Expressions:**
- `0 0 * * *` - Daily at midnight UTC
- `0 2 * * *` - Daily at 2:00 AM UTC
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight

After editing, re-run:
```bash
npm run analytics:setup-cron
```

### Change Cleanup Retention Period

Default: Keep last **90 days** of snapshots.

To change, edit the `cleanup_old_snapshots()` call:

```sql
-- Keep last 180 days instead
SELECT cron.schedule(
  'monthly_snapshot_cleanup',
  '0 1 1 * *',
  $$SELECT cleanup_old_snapshots(180)$$  -- <-- Change here
);
```

### Manual Cleanup

Delete snapshots older than N days:

```sql
-- Delete snapshots older than 30 days
SELECT * FROM cleanup_old_snapshots(30);
```

---

## 🔍 Monitoring & Troubleshooting

### View Scheduled Jobs

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
ORDER BY jobname;
```

### View Job Run History

```sql
-- Last 10 runs of daily snapshot job
SELECT
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'daily_project_snapshot'
)
ORDER BY start_time DESC
LIMIT 10;
```

### View Recent Snapshots

```sql
SELECT
  snapshot_date,
  total_users,
  total_messages,
  total_issues,
  metadata->>'created_via' as created_via,
  created_at
FROM project_snapshots
ORDER BY snapshot_date DESC
LIMIT 7;
```

### Common Issues

#### ❌ "pg_cron extension does not exist"

**Cause:** You're on Supabase Free Tier or pg_cron is not enabled.

**Solution:**
1. Upgrade to Supabase Pro, OR
2. Use the [Edge Functions alternative](#alternative-edge-functions)

#### ❌ "Snapshot already exists for today"

**Cause:** A snapshot was already created today (either manually or by cron).

**Solution:** This is expected behavior! Snapshots are unique per day. Wait until tomorrow or delete today's snapshot first:

```sql
DELETE FROM project_snapshots WHERE snapshot_date = CURRENT_DATE;
```

#### ❌ Cron job not running

**Check:**
1. Job is active: `SELECT * FROM cron.job WHERE jobname = 'daily_project_snapshot';`
2. Check run history for errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`
3. Verify timezone: Cron uses UTC, not your local timezone

**Fix:**
```sql
-- Unschedule and reschedule
SELECT cron.unschedule('daily_project_snapshot');
-- Then re-run: npm run analytics:setup-cron
```

#### ❌ Missing data in snapshots

**Check:**
- Are your tables (`profiles`, `messages`, `issues`) populated?
- Run manual snapshot to test: `SELECT * FROM create_daily_snapshot();`
- Check returned message for counts

---

## 🌐 Alternative: Edge Functions

If you're on **Supabase Free Tier** (no pg_cron), use Supabase Edge Functions with an external cron service.

### Step 1: Create Edge Function

Create `supabase/functions/daily-snapshot/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

serve(async (req) => {
  // Verify cron secret (optional but recommended)
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Call the database function
    const { data, error } = await supabase.rpc("create_daily_snapshot");

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating snapshot:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### Step 2: Deploy Edge Function

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy daily-snapshot
```

### Step 3: Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=generate-a-random-secret
```

### Step 4: Schedule with External Cron

Use a free cron service like **Cron-Job.org** or **EasyCron**:

1. **URL:** `https://your-project.supabase.co/functions/v1/daily-snapshot`
2. **Method:** `POST`
3. **Headers:** `Authorization: Bearer your-cron-secret`
4. **Schedule:** Daily at 00:00 UTC (`0 0 * * *`)

---

## 🎓 Summary

| Feature | pg_cron (Pro) | Edge Functions (Free) |
|---------|---------------|----------------------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Moderate |
| **Cost** | Requires Pro Plan | Free |
| **Reliability** | ⭐⭐⭐ Native | ⭐⭐ Depends on external service |
| **Maintenance** | None | External cron service |

**Recommendation:**
- **Supabase Pro users**: Use pg_cron (this guide)
- **Free Tier users**: Use Edge Functions + external cron

---

## 📚 Related Documentation

- [Analytics Dashboard Specification](../../docs/analytics-dashboard-spec.md)
- [Snapshots Service](../../src/lib/services/analytics/snapshotsService.ts)
- [SQL Setup Scripts](../sql/README.md)
- [Supabase pg_cron Docs](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

**Questions or Issues?**
- Check [Supabase Dashboard → Database → Cron Jobs](https://supabase.com/dashboard/project/_/database/cron-jobs)
- Review job run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
- Test manually: `SELECT * FROM create_daily_snapshot();`
