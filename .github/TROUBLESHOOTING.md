# GitHub Actions Troubleshooting

## Daily Analytics Snapshot nicht ausgeführt

### Problem: Workflow läuft nicht täglich

**Mögliche Ursachen:**
1. **Secrets fehlen** - `VITE_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` müssen gesetzt sein
2. **Repository ist inaktiv** - GitHub pausiert Workflows nach 60 Tagen Inaktivität
3. **Workflow ist disabled** - Check GitHub Actions UI

**Lösung:**
```bash
# 1. Secrets prüfen
# Gehe zu: Settings → Secrets and variables → Actions

# 2. Workflow manuell triggern
# Gehe zu: Actions → Daily Analytics Snapshot → Run workflow

# 3. Logs checken
# Actions → Daily Analytics Snapshot → Neuester Run → Job Details
```

### Problem: "Missing required environment variables"

**Fehler:**
```
❌ Missing required environment variables:
   - VITE_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
```

**Lösung:**
1. Gehe zu Repository Settings → Secrets and variables → Actions
2. Füge `VITE_SUPABASE_URL` hinzu (z.B. `https://xxx.supabase.co`)
3. Füge `SUPABASE_SERVICE_ROLE_KEY` hinzu (NICHT Anon Key!)

**Service Role Key finden:**
1. Gehe zu Supabase Dashboard
2. Settings → API
3. Kopiere "service_role" key (unter "Project API keys")

### Problem: "npm ci failed"

**Fehler:**
```
npm error code ENOENT
npm error syscall open
npm error path /home/runner/work/DegixDAW/DegixDAW/package-lock.json
```

**Lösung:**
```bash
# package-lock.json ist missing oder veraltet
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push
```

### Problem: Script läuft lokal, aber nicht in GitHub Actions

**Mögliche Ursachen:**
1. **Path-Probleme** - Script-Pfad ist nach Monorepo-Migration falsch
2. **Dependencies fehlen** - Workspace-Dependencies nicht installiert
3. **Git History fehlt** - `fetch-depth: 0` fehlt im Workflow

**Lösung:**
```yaml
# .github/workflows/daily-snapshot.yml
- name: 📥 Checkout Repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0  # ← Wichtig für commit counting!

- name: 📦 Install Dependencies
  run: |
    npm ci
    npm ci --workspace=web/frontend  # ← Workspace explizit installieren
```

### Problem: "Could not fetch DB size"

**Warnung:**
```
⚠️ Could not fetch DB size: permission denied for function get_database_size
⚠️ Using estimate (0 MB)
```

**Ursache:** SQL Function `get_database_size()` fehlt oder Service Role Key hat keine Permissions

**Lösung:**
```sql
-- In Supabase SQL Editor ausführen:
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database())
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_database_size() TO service_role;
```

### Problem: "Snapshot already exists for today"

**Meldung:**
```
⚠️ Snapshot already exists for today!
```

**Das ist OK!** Der Workflow läuft täglich nur einmal. Wenn du manuell mehrmals am selben Tag triggerst, wird ein Duplikat verhindert.

**Lösung (wenn du wirklich ein neues Snapshot brauchst):**
```sql
-- In Supabase SQL Editor:
DELETE FROM project_snapshots
WHERE snapshot_date = CURRENT_DATE;
```

## Workflow manuell testen

```bash
# 1. Lokal testen (benötigt .env.local)
cd web/frontend
node scripts/analytics/create-snapshot-github-actions.js

# 2. Mit echten Secrets testen
VITE_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy node scripts/analytics/create-snapshot-github-actions.js

# 3. GitHub Actions manuell triggern
# Actions → Daily Analytics Snapshot → Run workflow → Run workflow
```

## Weitere Hilfe

- [GitHub Actions Logs](https://github.com/yourusername/DegixDAW/actions)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [CLAUDE.md - GitHub Actions Section](../CLAUDE.md#github-actions--cicd)
