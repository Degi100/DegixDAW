# Analytics Scripts

Scripts for managing project analytics snapshots and historical data.

## 📋 Table of Contents

- [Overview](#overview)
- [Scripts](#scripts)
- [Automated Daily Snapshots](#automated-daily-snapshots)
- [Related Documentation](#related-documentation)

---

## 🎯 Overview

The analytics system tracks project growth over time by creating snapshots of key metrics:

- **Users**: Total and active users
- **Messages**: Total messages and conversations
- **Issues**: Total, open, closed, in-progress issues
- **Storage**: Database and storage size
- **Code Metrics**: Lines of code, files, commits (manual only)

Snapshots power the **GrowthChart** in the Admin Analytics Dashboard.

---

## 📜 Scripts

### `create-snapshot-github-actions.js` ⭐ **Empfohlen**

Standalone Snapshot-Creator für automatische Ausführung (GitHub Actions oder lokal).

**Usage:**
```bash
npm run analytics:snapshot
```

**Was es macht:**
1. Sammelt ALLE Metriken (inkl. Code-Stats via Git)
2. Erstellt vollständigen Snapshot in DB
3. Läuft standalone ohne Browser/API-Server

**Features:**
- ✅ Volle Code-Metriken (LOC, Commits, Files)
- ✅ Language Breakdown (TypeScript, JavaScript, SCSS, etc.)
- ✅ User, Message, Issue Stats
- ✅ Automatisch via GitHub Actions
- ✅ Manuell triggerbar für Testing

**Setup:** Siehe [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)

---

### `backfill-snapshots.js`

Backfills historical snapshots for dates where no snapshot exists.

**Usage:**
```bash
npm run analytics:backfill
```

**Was es macht:**
1. Findet Lücken in Snapshot-Historie
2. Erstellt Snapshots für fehlende Daten
3. Nutzt aktuelle Metriken (keine historischen Daten)

**Wichtig:** Erstellt "synthetische" historische Daten basierend auf aktuellen Metriken. Für genaue historische Daten: [Automatische Snapshots aktivieren](#automated-daily-snapshots).

**Example Output:**
```
📊 Analytics Snapshots Backfill Script
🔍 Checking existing snapshots...
✅ Found 5 existing snapshots (last: 2025-10-11)

📈 Creating 7 backfill snapshots...
✅ Created snapshot for 2025-10-04
✅ Created snapshot for 2025-10-05
...
✅ Backfill complete! Created 7 snapshots
```

---

## ⏰ Automated Daily Snapshots

Statt manueller Backfills: **Automatische tägliche Snapshots** um Mitternacht UTC.

### 🏆 Empfohlen: GitHub Actions ⭐

```bash
# 1. GitHub Secrets setzen (einmalig)
# 2. Dateien committen & pushen
git add .github/workflows/daily-snapshot.yml
git push

# ✅ Fertig! Läuft täglich automatisch
```

**Vorteile:**
- ✅ **Kostenlos** (GitHub Actions Free Tier)
- ✅ **Volle Code-Metriken** (LOC, Commits, Languages)
- ✅ **Kein Server nötig**
- ✅ **Manuell triggerbar** (via GitHub UI)

**Vollständige Anleitung:** [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)

---

### Alternative Optionen

| Methode | Geeignet für | Setup | Code-Metriken |
|---------|--------------|-------|---------------|
| **GitHub Actions** ⭐ | Alle | ⭐ Easy | ✅ Ja |
| **pg_cron** | Supabase Pro | ⭐ Easy | ❌ Nein |
| **Edge Functions** | Free Tier | ⭐⭐ Mittel | ❌ Nein |
| **Manueller Button** | Testing | ⭐ Sofort | ✅ Ja |

**Vollständige pg_cron/Edge Functions Anleitung:** [CRON_SETUP.md](./CRON_SETUP.md)

### What Gets Tracked Automatically

✅ **Tracked by Cron:**
- Users (total, active)
- Messages (total, conversations)
- Issues (total, open, closed, in_progress)
- Storage (database, storage, total)

❌ **NOT Tracked (Manual Only):**
- Code Metrics (LOC, files, commits) - Requires GitHub API
- Language Breakdown - Same as above

**Solution:** Use the "Create Snapshot" button in Admin Dashboard for full snapshots with code metrics.

---

## 🔄 Workflow

### Initial Setup (One-Time)

```bash
# 1. Create database table
npm run db:sql analytics_snapshots_table

# 2. Add language breakdown columns
npm run db:sql analytics_snapshots_language_breakdown

# 3. Set up automated snapshots
npm run analytics:setup-cron

# 4. (Optional) Backfill historical data
npm run analytics:backfill
```

### Ongoing Maintenance

**Option A: Fully Automated (Recommended)**
- Cron job runs daily at 00:00 UTC
- No manual intervention needed
- Database metrics tracked automatically
- Admins can manually trigger full snapshots (with code metrics) via dashboard

**Option B: Manual Snapshots**
- Admin clicks "Create Snapshot" button in dashboard
- Tracks ALL metrics including code metrics
- Best for occasional updates

---

## 📊 Viewing Snapshots

### In Admin Dashboard

1. Navigate to **Admin** → **Analytics**
2. View **Growth Chart** showing historical timeline
3. Click **Create Snapshot** to manually create full snapshot

### In Database

```sql
-- View all snapshots
SELECT * FROM project_snapshots ORDER BY snapshot_date DESC;

-- View recent snapshots
SELECT
  snapshot_date,
  total_users,
  total_messages,
  total_issues,
  metadata->>'created_via' as source
FROM project_snapshots
ORDER BY snapshot_date DESC
LIMIT 7;

-- View cron-created vs manual snapshots
SELECT
  metadata->>'created_via' as source,
  COUNT(*) as count
FROM project_snapshots
GROUP BY source;
```

---

## 🧹 Cleanup

Delete old snapshots (keeps last 90 days):

```sql
SELECT * FROM cleanup_old_snapshots(90);
```

Or manually:

```sql
DELETE FROM project_snapshots
WHERE snapshot_date < CURRENT_DATE - INTERVAL '90 days';
```

**Note:** If using pg_cron, cleanup runs automatically on the 1st of each month.

---

## 🐛 Troubleshooting

### No snapshots in GrowthChart

**Check:**
1. Table exists: `SELECT COUNT(*) FROM project_snapshots;`
2. Snapshots created: `npm run analytics:backfill`
3. Date range: Chart only shows data for available snapshots

### Cron job not creating snapshots

**Check:**
1. pg_cron enabled: `SELECT * FROM cron.job;`
2. Job scheduled: `SELECT * FROM cron.job WHERE jobname = 'daily_project_snapshot';`
3. Job history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

**Fix:**
```bash
npm run analytics:setup-cron
```

### Missing code metrics in snapshots

**Cause:** Cron-created snapshots don't include code metrics (GitHub API required).

**Solution:** Click "Create Snapshot" in Admin Dashboard to manually create full snapshot.

---

## 📚 Related Documentation

- [CRON_SETUP.md](./CRON_SETUP.md) - Automated daily snapshots guide
- [../../scripts/sql/analytics_snapshots_table.sql](../sql/analytics_snapshots_table.sql) - Database schema
- [../../scripts/sql/analytics_snapshots_cron.sql](../sql/analytics_snapshots_cron.sql) - Cron job setup
- [../../src/lib/services/analytics/snapshotsService.ts](../../src/lib/services/analytics/snapshotsService.ts) - TypeScript service
- [../../supabase/functions/daily-snapshot/](../../supabase/functions/daily-snapshot/) - Edge Function alternative

---

## 💡 Best Practices

1. **Enable automated snapshots** - Set up pg_cron or Edge Functions for daily snapshots
2. **Manual full snapshots** - Create monthly full snapshots (with code metrics) via dashboard
3. **Monitor cron jobs** - Check logs regularly to ensure snapshots are created
4. **Cleanup old data** - Enable monthly cleanup to prevent database bloat
5. **Backup before cleanup** - Export snapshots before deleting old data

---

**Questions?** Check [CRON_SETUP.md](./CRON_SETUP.md) or [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron).
