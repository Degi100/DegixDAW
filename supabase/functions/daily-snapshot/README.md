# Daily Snapshot Edge Function

Alternative to pg_cron for Supabase Free Tier users. Creates daily project analytics snapshots via external cron services.

## 🎯 Purpose

Automatically create daily snapshots of project metrics (users, messages, issues, storage) for the Analytics Dashboard timeline.

## 📦 Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- External cron service account (e.g., [Cron-Job.org](https://cron-job.org), [EasyCron](https://www.easycron.com))
- Database function `create_daily_snapshot()` exists (run `npm run analytics:setup-cron`)

## 🚀 Deployment

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### Step 3: Deploy Function

```bash
# From project root
supabase functions deploy daily-snapshot
```

**Expected Output:**
```
Deploying daily-snapshot to Supabase...
✓ Function deployed successfully
URL: https://your-project.supabase.co/functions/v1/daily-snapshot
```

### Step 4: Set Environment Variables

In **Supabase Dashboard** → **Edge Functions** → **daily-snapshot** → **Settings**:

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Dashboard → Settings → API → Service Role Key (secret) |
| `CRON_SECRET` | `your-random-secret` | Generate with: `openssl rand -base64 32` |

**⚠️ Security Warning:** Never commit the Service Role Key to Git! It has full database access.

## 🕐 Schedule with External Cron

### Option 1: Cron-Job.org (Recommended)

1. **Sign up** at [cron-job.org](https://cron-job.org) (free tier: 50 jobs)
2. **Create Cron Job**:
   - **Title:** "DegixDAW Daily Snapshot"
   - **URL:** `https://your-project.supabase.co/functions/v1/daily-snapshot`
   - **Method:** `POST`
   - **Schedule:** `0 0 * * *` (daily at midnight UTC)
   - **Request Headers:**
     ```
     Authorization: Bearer your-cron-secret
     ```
3. **Save & Enable**

### Option 2: EasyCron

1. **Sign up** at [easycron.com](https://www.easycron.com) (free tier: 1 job)
2. **Create Cron Job**:
   - **URL:** `https://your-project.supabase.co/functions/v1/daily-snapshot`
   - **Cron Expression:** `0 0 * * *`
   - **HTTP Method:** `POST`
   - **HTTP Headers:**
     ```
     Authorization: Bearer your-cron-secret
     ```
3. **Test & Enable**

### Option 3: GitHub Actions (Alternative)

Create `.github/workflows/daily-snapshot.yml`:

```yaml
name: Daily Analytics Snapshot

on:
  schedule:
    # Runs every day at 00:00 UTC
    - cron: '0 0 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Snapshot
        run: |
          curl -X POST "${{ secrets.EDGE_FUNCTION_URL }}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Secrets to add** (Settings → Secrets → Actions):
- `EDGE_FUNCTION_URL`: `https://your-project.supabase.co/functions/v1/daily-snapshot`
- `CRON_SECRET`: Your cron secret

## 🧪 Testing

### Test via cURL

```bash
curl -X POST https://your-project.supabase.co/functions/v1/daily-snapshot \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "snapshot_id": "abc-123-...",
    "snapshot_date": "2025-10-11",
    "message": "Snapshot created successfully! Users: 42, Messages: 1337, Issues: 23"
  },
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```

**Expected Response (Already Exists):**
```json
{
  "success": true,
  "data": {
    "snapshot_id": "existing-id",
    "snapshot_date": "2025-10-11",
    "message": "Snapshot already exists for today"
  },
  "timestamp": "2025-10-11T00:05:00.000Z"
}
```

**Error Response (Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized. Invalid or missing Authorization header.",
  "timestamp": "2025-10-11T00:00:00.000Z"
}
```

### Test via Supabase Dashboard

1. Go to **Edge Functions** → **daily-snapshot**
2. Click **Invoke**
3. Set **Method:** `POST`
4. Add **Header:** `Authorization: Bearer your-cron-secret`
5. Click **Send Request**

## 🔍 Monitoring

### View Function Logs

**Supabase Dashboard** → **Edge Functions** → **daily-snapshot** → **Logs**

Look for:
```
[daily-snapshot] Calling create_daily_snapshot() RPC...
[daily-snapshot] Snapshot created successfully: {...}
```

### View Snapshot in Database

```sql
-- View today's snapshot
SELECT * FROM project_snapshots
WHERE snapshot_date = CURRENT_DATE;

-- View last 7 snapshots
SELECT
  snapshot_date,
  total_users,
  total_messages,
  metadata->>'created_via' as source
FROM project_snapshots
ORDER BY snapshot_date DESC
LIMIT 7;
```

## 🐛 Troubleshooting

### ❌ "Unauthorized" Error

**Cause:** Missing or incorrect `CRON_SECRET` in Authorization header.

**Fix:**
1. Verify `CRON_SECRET` is set in Edge Function settings
2. Verify Authorization header: `Bearer your-secret` (no extra spaces)

### ❌ "Database error: function create_daily_snapshot does not exist"

**Cause:** Database function not created.

**Fix:**
```bash
npm run analytics:setup-cron
```

### ❌ "Snapshot already exists for today"

**Cause:** A snapshot was already created today (expected behavior).

**Fix:** This is normal! Each day can only have one snapshot. Wait until tomorrow or delete today's snapshot:
```sql
DELETE FROM project_snapshots WHERE snapshot_date = CURRENT_DATE;
```

### ❌ Cron service not triggering

**Check:**
1. Cron job is enabled in service dashboard
2. URL is correct (includes `/functions/v1/daily-snapshot`)
3. Method is `POST` (not GET)
4. Authorization header is set correctly
5. Check cron service logs for errors

## 📊 What Gets Tracked

| Metric | Tracked by Edge Function? | Notes |
|--------|---------------------------|-------|
| Users (total, active) | ✅ Yes | From `profiles` table |
| Messages (total, conversations) | ✅ Yes | From `messages` table |
| Issues (total, open, closed, in_progress) | ✅ Yes | From `issues` table |
| Storage (database, storage, total) | ✅ Yes | Calculated from `pg_tables` |
| Code Metrics (LOC, files, commits) | ❌ No | Requires GitHub API (manual only) |
| Language Breakdown | ❌ No | Same as above |

**Note:** For full snapshots with code metrics, use the "Create Snapshot" button in the Admin Dashboard.

## 🔒 Security Best Practices

1. **Always set `CRON_SECRET`** - Never leave the endpoint public
2. **Use HTTPS** - Supabase functions use HTTPS by default
3. **Rotate secrets** - Change `CRON_SECRET` every 90 days
4. **Monitor logs** - Check for unauthorized access attempts
5. **Never commit secrets** - Use environment variables only

## 📚 Related Files

- SQL Setup: [scripts/sql/analytics_snapshots_cron.sql](../../scripts/sql/analytics_snapshots_cron.sql)
- Snapshots Service: [src/lib/services/analytics/snapshotsService.ts](../../src/lib/services/analytics/snapshotsService.ts)
- Full Documentation: [scripts/analytics/CRON_SETUP.md](../CRON_SETUP.md)

## 💡 Tips

- Test manually after deployment: `curl -X POST ...`
- Check logs regularly in Supabase Dashboard
- Set up email notifications in your cron service for failures
- Use GitHub Actions if you want version-controlled scheduling

---

**Questions?** Check the [full cron setup guide](../CRON_SETUP.md) or [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions).
